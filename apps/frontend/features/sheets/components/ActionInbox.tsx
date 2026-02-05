
import React, { useState, useEffect } from 'react';
import * as Y from 'yjs';

interface ActionInboxProps {
  doc: Y.Doc | null;
  currentUser: { id: string; name: string };
}

export const ActionInbox: React.FC<ActionInboxProps> = ({ doc, currentUser }) => {
  const [assignments, setAssignments] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!doc) return;

    const assignmentsMap = doc.getMap('assignments');

    const updateAssignments = () => {
      const myAssignments: string[] = [];
      assignmentsMap.forEach((userId, key) => {
        if (userId === currentUser.id) {
            // key format: "sheetId_rowIndex" or just "0_rowIndex" as per current impl
            myAssignments.push(key); 
        }
      });
      setAssignments(myAssignments);
    };

    assignmentsMap.observe(updateAssignments);
    updateAssignments(); // Initial fetch

    return () => {
      assignmentsMap.unobserve(updateAssignments);
    };
  }, [doc, currentUser.id]);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Inbox</span>
        {assignments.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {assignments.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">My Action Items</h3>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {assignments.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-2">No assigned tasks.</p>
            ) : (
              <ul className="space-y-2">
                {assignments.map((key) => {
                  const [_sheetIndex, rowIndex] = key.split('_');
                  return (
                    <li key={key} className="text-sm p-2 bg-zinc-50 dark:bg-zinc-800 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer">
                      <span className="font-medium">Row {parseInt(rowIndex) + 1}</span>
                      <span className="block text-xs text-zinc-500">Assigned to you</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
