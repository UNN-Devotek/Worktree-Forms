'use client';

import React, { useState, useMemo } from 'react';
import { useSheet } from '../../providers/SheetProvider';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ColumnMapping {
  statusColumn: string | null;
  labelColumn: string | null;
}

interface KanbanCard {
  id: string;
  label: string;
  status: string;
  row: any;
}

function SortableCard({ card, onClick }: { card: KanbanCard; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className="p-3 mb-2 hover:shadow-md transition-shadow cursor-pointer group"
        onClick={onClick}
      >
        <div className="flex items-start gap-2">
          <div {...listeners} className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{card.label}</div>
            {card.row.description && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {card.row.description}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function KanbanLane({ status, cards, onCardClick }: { status: string; cards: KanbanCard[]; onCardClick: (cardId: string) => void }) {
  return (
    <div className="flex-1 min-w-[280px] max-w-[350px]">
      <div className="bg-muted/30 rounded-lg p-4 h-full flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-sm">{status || 'No Status'}</h3>
          <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full">
            {cards.length}
          </span>
        </div>

        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex-1 overflow-y-auto space-y-2">
            {cards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No cards
              </div>
            ) : (
              cards.map(card => (
                <SortableCard key={card.id} card={card} onClick={() => onCardClick(card.id)} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function CardView() {
  const { data, columns, openDetailPanel, updateCell } = useSheet();
  const [mapping, setMapping] = useState<ColumnMapping>({
    statusColumn: null,
    labelColumn: null,
  });
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Auto-detect status and label columns
  useMemo(() => {
    const statusCol = columns.find(col =>
      col.type === 'SELECT' ||
      /status|state|stage|category|phase/i.test(col.label)
    );

    const labelCol = columns.find(col =>
      col.type === 'TEXT' ||
      /name|title|task|label/i.test(col.label)
    ) || columns[0];

    if (statusCol) {
      setMapping({
        statusColumn: statusCol.id,
        labelColumn: labelCol?.id || null,
      });
    }
  }, [columns]);

  const { statusColumn, labelColumn } = mapping;

  // Check if mapping is complete
  const isMappingComplete = !!statusColumn;

  // Group cards by status
  const cardsByStatus = useMemo(() => {
    if (!isMappingComplete) return new Map();

    const map = new Map<string, KanbanCard[]>();

    data.forEach(row => {
      const status = row[statusColumn] || 'No Status';
      const label = labelColumn ? row[labelColumn] : row.id;

      if (!map.has(status)) {
        map.set(status, []);
      }

      map.get(status)!.push({
        id: row.id,
        label,
        status,
        row,
      });
    });

    return map;
  }, [data, statusColumn, labelColumn, isMappingComplete]);

  // Get unique statuses
  const statuses = useMemo(() => {
    return Array.from(cardsByStatus.keys()).sort();
  }, [cardsByStatus]);

  const handleDragStart = (event: DragStartEvent) => {
    const cardId = event.active.id as string;
    const allCards = Array.from(cardsByStatus.values()).flat();
    const card = allCards.find(c => c.id === cardId);
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCardId = active.id as string;
    const overCardId = over.id as string;

    // Find the card being dragged
    const allCards = Array.from(cardsByStatus.values()).flat();
    const activeCard = allCards.find(c => c.id === activeCardId);
    const overCard = allCards.find(c => c.id === overCardId);

    if (!activeCard) return;

    // If dropped on a card in a different status, update the status
    if (overCard && activeCard.status !== overCard.status) {
      updateCell(activeCardId, statusColumn, overCard.status);
    }
  };

  const handleDragCancel = () => {
    setActiveCard(null);
  };

  if (!isMappingComplete) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/5 p-8">
        <div className="max-w-2xl w-full bg-background border rounded-lg p-8 shadow-sm">
          <div className="flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Configure Card View</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Map a status or category column to display tasks in a Kanban board.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status/Category Column</label>
              <Select value={mapping.statusColumn || ''} onValueChange={(val) => setMapping({ ...mapping, statusColumn: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status column..." />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Label Column (Optional)</label>
              <Select value={mapping.labelColumn || ''} onValueChange={(val) => setMapping({ ...mapping, labelColumn: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select label column..." />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/5">
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-medium mb-2">No Cards Found</h3>
          <p className="text-sm text-muted-foreground">
            Add some data to your sheet to see cards here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="h-full w-full overflow-x-auto bg-background p-6">
        <div className="flex gap-4 h-full min-w-max">
          {statuses.map(status => (
            <KanbanLane
              key={status}
              status={status}
              cards={cardsByStatus.get(status) || []}
              onCardClick={openDetailPanel}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <Card className="p-3 shadow-lg rotate-3 opacity-90">
            <div className="font-medium text-sm">{activeCard.label}</div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
