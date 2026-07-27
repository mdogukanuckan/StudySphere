
export interface Universe{
    id : string;
    name : string;
    description : string;
    createdAt : string;
    updatedAt : string;
    isArchived ?: boolean;
}

export interface DeleteUniverseResult {
    archived: boolean;
}

export interface CreateUniverseRequest{
    name : string;
    description : string;
}

export interface UpdateUniverseRequest{
    name?: string;
    description?: string;
}