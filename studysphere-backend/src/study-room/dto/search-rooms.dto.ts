import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class SearchRoomsDto {

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    q !: string;
}
