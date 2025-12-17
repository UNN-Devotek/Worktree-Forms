import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

export function DashboardTable() {
    const rows = [
        { header: "Cover page", type: "Cover page", target: 18, limit: 5, reviewer: "Eddie Lake" },
        { header: "Table of contents", type: "Table of contents", target: 29, limit: 24, reviewer: "Eddie Lake" },
        { header: "Executive summary", type: "Narrative", target: 10, limit: 13, reviewer: "Eddie Lake" },
        { header: "Technical approach", type: "Narrative", target: 27, limit: 23, reviewer: "Jamik Toshpulatov" },
        { header: "Design", type: "Narrative", target: 2, limit: 16, reviewer: "Jamik Toshpulatov" },
        { header: "Capabilities", type: "Narrative", target: 20, limit: 8, reviewer: "Jamik Toshpulatov" },
        { header: "Integration with existing systems", type: "Narrative", target: 19, limit: 21, reviewer: "Jamik Toshpulatov" },
        { header: "Innovation and Advantages", type: "Narrative", target: 25, limit: 26, reviewer: "Assign reviewer", needsReview: true },
        { header: "Overview of EMR's Innovative Solutions", type: "Technical content", target: 7, limit: 23, reviewer: "Assign reviewer", needsReview: true },
        { header: "Advanced Algorithms and Machine Learning", type: "Narrative", target: 30, limit: 28, reviewer: "Assign reviewer", needsReview: true },
    ];

    return (
        <div className="rounded-md border border-border bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="border-border hover:bg-muted/50">
                        <TableHead className="w-[30%] text-muted-foreground">Header</TableHead>
                        <TableHead className="text-muted-foreground">Section Type</TableHead>
                        <TableHead className="text-center text-muted-foreground">Target</TableHead>
                        <TableHead className="text-center text-muted-foreground">Limit</TableHead>
                        <TableHead className="text-muted-foreground">Reviewer</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, i) => (
                        <TableRow key={i} className="border-border hover:bg-muted/50">
                            <TableCell className="font-medium text-foreground">
                                <div className="flex items-center gap-2">
                                     <div className="h-2 w-2 rounded-full border border-zinc-500"></div>
                                     {row.header}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="bg-background text-foreground border-border hover:bg-muted">
                                    {row.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                                <span className="inline-flex items-center justify-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                    {row.target}
                                </span>
                            </TableCell>
                             <TableCell className="text-center">
                                <span className="inline-flex items-center justify-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                    {row.limit}
                                </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {row.needsReview ? (
                                    <Button variant="outline" size="sm" className="h-7 text-xs border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground">
                                        {row.reviewer}
                                    </Button>
                                ) : row.reviewer}
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="border-t border-border p-4 text-xs text-muted-foreground flex justify-between items-center">
                <span>0 of 68 row(s) selected.</span>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        Rows per page
                        <select className="bg-background border border-border rounded px-1 text-foreground">
                            <option>10</option>
                            <option>20</option>
                        </select>
                    </div>
                    <span>Page 1 of 7</span>
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-6 w-6 border-border bg-background p-0 text-muted-foreground hover:bg-muted" disabled>&lt;&lt;</Button>
                        <Button variant="outline" size="icon" className="h-6 w-6 border-border bg-background p-0 text-muted-foreground hover:bg-muted" disabled>&lt;</Button>
                        <Button variant="outline" size="icon" className="h-6 w-6 border-border bg-background p-0 text-muted-foreground hover:bg-muted">&gt;</Button>
                        <Button variant="outline" size="icon" className="h-6 w-6 border-border bg-background p-0 text-muted-foreground hover:bg-muted">&gt;&gt;</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
