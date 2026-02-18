'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSheet } from '../../providers/SheetProvider';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { t } from '@/lib/i18n';

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
              <div className="text-center py-8 text-muted-foreground text-sm" data-lane-status={status}>
                {t('card.no_cards', 'No cards')}
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

  // Finding #1 (R8): useEffect instead of useMemo — setState is a side-effect.
  useEffect(() => {
    if (mapping.statusColumn) return; // already configured
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
  }, [columns]); // eslint-disable-line react-hooks/exhaustive-deps -- guard prevents loop

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

  // Finding #6 (R8): handle drag to both cards AND empty lanes.
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCardId = active.id as string;
    const overCardId = over.id as string;

    // Find the card being dragged
    const allCards = Array.from(cardsByStatus.values()).flat();
    const draggedCard = allCards.find(c => c.id === activeCardId);

    if (!draggedCard || !statusColumn) return;

    // Check if dropped on another card
    const overCard = allCards.find(c => c.id === overCardId);
    if (overCard && draggedCard.status !== overCard.status) {
      updateCell(activeCardId, statusColumn, overCard.status);
      return;
    }

    // Check if dropped on an empty lane (the lane div has data-lane-status)
    const overElement = document.querySelector(`[data-lane-status="${overCardId}"]`);
    if (overElement) {
      const laneStatus = overElement.getAttribute('data-lane-status');
      if (laneStatus && laneStatus !== draggedCard.status) {
        updateCell(activeCardId, statusColumn, laneStatus);
      }
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
              <h3 className="text-lg font-semibold mb-2">{t('card.configure_title', 'Configure Card View')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('card.configure_desc', 'Map a status or category column to display tasks in a Kanban board.')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('card.status_column', 'Status/Category Column')}</label>
              <Select value={mapping.statusColumn || ''} onValueChange={(val) => setMapping({ ...mapping, statusColumn: val })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('card.select_status', 'Select status column...')} />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('card.label_column', 'Label Column (Optional)')}</label>
              <Select value={mapping.labelColumn || ''} onValueChange={(val) => setMapping({ ...mapping, labelColumn: val })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('card.select_label', 'Select label column...')} />
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
          <h3 className="text-lg font-medium mb-2">{t('card.no_cards_found', 'No Cards Found')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('card.add_data_hint', 'Add some data to your sheet to see cards here.')}
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
