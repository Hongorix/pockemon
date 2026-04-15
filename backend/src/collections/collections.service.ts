import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { Collection, CollectionDocument } from './schemas/collection.schema';
import { validateCollectionRules } from './validation/rules';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel(Collection.name)
    private readonly collectionModel: Model<CollectionDocument>,
  ) {}

  async create(createCollectionDto: CreateCollectionDto) {
    const validation = validateCollectionRules(createCollectionDto.items);

    if (validation.violations.length > 0) {
      throw new BadRequestException({
        message: 'Collection validation failed',
        violations: validation.violations,
      });
    }

    const created = await this.collectionModel.create({
      name: createCollectionDto.name,
      items: createCollectionDto.items,
      totalWeight: validation.totalWeight,
    });

    return created.toObject();
  }

  async findAll() {
    const collections = await this.collectionModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return collections;
  }

  async findOne(id: string) {
    const collection = await this.collectionModel.findById(id).lean().exec();

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  async remove(id: string) {
    const result = await this.collectionModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Collection not found');
    }

    return { deleted: true, id };
  }
}
