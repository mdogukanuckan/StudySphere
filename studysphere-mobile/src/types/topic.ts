
export interface Topic{
    id: string;
    name : string;
    subjectId : string;
    createdAt : string;
    updatedAt : string;
    notes ?: string | null;
}

export interface CreateTopicRequest{
    name : string;
    subjectId : string;
}

export interface UpdateTopicRequest {
    name ?: string;
    notes ?: string | null;
}