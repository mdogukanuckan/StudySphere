import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUniverseDto {

    @IsString()
    @IsNotEmpty({message :'Çalışma evreni ismi boş olamaz'})
    name !: string;

    @IsString()
    @IsOptional()
    description !: string;

}
