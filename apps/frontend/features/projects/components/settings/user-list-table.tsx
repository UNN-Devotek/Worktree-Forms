"use client";

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
import { MoreHorizontal, Trash2, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { revokeInvitation } from "@/features/users/server/invite-actions";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserListTableProps {
  projectId: string;
  members: any[];
  invitations: any[];
}

export function UserListTable({ projectId, members, invitations }: UserListTableProps) {
  
  async function handleRevoke(inviteId: string) {
    const result = await revokeInvitation(inviteId, projectId);
    if (result.success) {
        toast.success("Invitation revoked");
    } else {
        toast.error("Failed to revoke");
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Members */}
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="flex items-center gap-3">
                 <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user.image} />
                    <AvatarFallback>{member.user.name?.[0] || member.user.email?.[0]}</AvatarFallback>
                 </Avatar>
                 <div className="flex flex-col">
                    <span className="font-medium">{member.user.name}</span>
                    <span className="text-xs text-muted-foreground">{member.user.email}</span>
                 </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                    {member.roles.map((r: string) => (
                        <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                    ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                    Active
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive">
                            Remove User
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}

          {/* Invitations */}
          {invitations.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell className="flex items-center gap-3 text-muted-foreground">
                 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Mail className="h-4 w-4" />
                 </div>
                 <div className="flex flex-col">
                    <span className="font-medium italic">{invite.email}</span>
                    <span className="text-xs">Invited by {invite.inviter?.name || "Member"}</span>
                 </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                    {invite.roles.map((r: string) => (
                        <Badge key={r} variant="outline" className="text-xs border-dashed">{r}</Badge>
                    ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800">
                    Pending
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRevoke(invite.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Revoke Invite
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          
          {members.length === 0 && invitations.length === 0 && (
            <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                    No members found.
                </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
