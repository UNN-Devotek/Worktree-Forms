'use client';

import React from 'react';
import { Grid, Cell } from '@rowsncolumns/grid';

export function RowsNColumnsExample() {
  const [data] = React.useState<any[]>([
    ['Task Name', 'Status', 'Assignee'],
    ['Design System', 'In Progress', 'Alice'],
    ['API Setup', 'Done', 'Bob'],
  ]);

  return (
    <div className="w-full h-[600px] border rounded-md overflow-hidden relative">
      <Grid
        width={800}
        height={600}
        rowCount={100}
        columnCount={26}
itemRenderer={(props) => {
          const { rowIndex, columnIndex } = props;
          if (rowIndex < data.length && columnIndex < data[0].length) {
            return (
              <Cell
                {...props}
                text={data[rowIndex][columnIndex]}
              />
            );
          }
          return (
            <Cell
              {...props}
            />
          );
        }}
      />
    </div>
  );
}
