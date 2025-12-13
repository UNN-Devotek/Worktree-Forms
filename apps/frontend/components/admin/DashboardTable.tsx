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
        <div className="rounded-md border border-zinc-800 bg-zinc-900/50">
            <Table>
                <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                        <TableHead className="w-[30%] text-zinc-400">Header</TableHead>
                        <TableHead className="text-zinc-400">Section Type</TableHead>
                        <TableHead className="text-center text-zinc-400">Target</TableHead>
                        <TableHead className="text-center text-zinc-400">Limit</TableHead>
                        <TableHead className="text-zinc-400">Reviewer</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, i) => (
                        <TableRow key={i} className="border-zinc-800 hover:bg-zinc-900/50">
                            <TableCell className="font-medium text-zinc-200">
                                <div className="flex items-center gap-2">
                                     <div className="h-2 w-2 rounded-full border border-zinc-600"></div>
                                     {row.header}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-900">
                                    {row.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                                <span className="inline-flex items-center justify-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                                    {row.target}
                                </span>
                            </TableCell>
                             <TableCell className="text-center">
                                <span className="inline-flex items-center justify-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                                    {row.limit}
                                </span>
                            </TableCell>
                            <TableCell className="text-zinc-400">
                                {row.needsReview ? (
                                    <Button variant="outline" size="sm" className="h-7 text-xs border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                                        {row.reviewer}
                                    </Button>
                                ) : row.reviewer}
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-200">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="border-t border-zinc-800 p-4 text-xs text-zinc-500 flex justify-between items-center">
                <span>0 of 68 row(s) selected.</span>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        Rows per page
                        <select className="bg-zinc-900 border border-zinc-800 rounded px-1 text-zinc-300">
                            <option>10</option>
                            <option>20</option>
                        </select>
                    </div>
                    <span>Page 1 of 7</span>
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-6 w-6 border-zinc-800 bg-zinc-900 p-0 text-zinc-400 hover:bg-zinc-800" disabled>&lt;&lt;</Button>
                        <Button variant="outline" size="icon" className="h-6 w-6 border-zinc-800 bg-zinc-900 p-0 text-zinc-400 hover:bg-zinc-800" disabled>&lt;</Button>
                        <Button variant="outline" size="icon" className="h-6 w-6 border-zinc-800 bg-zinc-900 p-0 text-zinc-400 hover:bg-zinc-800">&gt;</Button>
                        <Button variant="outline" size="icon" className="h-6 w-6 border-zinc-800 bg-zinc-900 p-0 text-zinc-400 hover:bg-zinc-800">&gt;&gt;</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
