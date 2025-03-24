import { ArgumentMetadata, Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { registerDecorator, validate, ValidationOptions, ValidationArguments } from 'class-validator';


@Injectable()
export class ValidationPipe implements PipeTransform<any> {
    async transform(value: any, { metatype }: ArgumentMetadata) {
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        const object = plainToInstance(metatype, value);
        const errors = await validate(object);
        if (errors.length > 0) {
            throw new BadRequestException('Validation failed');
        }
        return value;
    }

    private toValidate(metatype: Function): boolean {
        const types: Function[] = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }
}


export function IsMinRangeLessThanMaxRange(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isMinRangeLessThanMaxRange',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const obj = args.object as any;
                    return obj.minRange < obj.maxRange;
                },
                defaultMessage(args: ValidationArguments) {
                    return 'Giá trị đầu (minRange) phải nhỏ hơn giá trị cuối (maxRange).';
                },
            },
        });
    };
}
