import { Universe } from "./universe";

export interface Subject{
    id : string,
    name : string,
    universeId : string,
    createdAt : string,
    updatedAt : string,
    universe ?: Universe;
    isArchived ?: boolean;
    targetDate ?: string | null;
    targetLabel ?: string | null;
}


export interface DeleteSubjectResult {
    archived: boolean;
}

export interface CreateSubjectRequest{
    name : string,
    universeId : string;
    targetDate ?: string | null;
    targetLabel ?: string | null;
}

export interface UpdateSubjectRequest{
    name : string;
    targetDate ?: string | null;
    targetLabel ?: string | null;
}