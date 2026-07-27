import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";


export class CreateTopicDto {

    @IsString()
    @IsNotEmpty({message:'Konu adı boş bırakılamaz'})
    name !: string;

    @IsUUID('4',{message:'Geçerli bir Ders formatı seçiniz'})
    @IsNotEmpty({message:'Ders alanı boş bırakulamaz'})
    subjectId !: string;

    @IsString()
    @IsOptional()
    notes ?: string | null;
}
