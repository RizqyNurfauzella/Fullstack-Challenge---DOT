import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    categoryId?: number,
  ) {
    page = Number.isFinite(page) && page > 0 ? page : 1;
    limit = Number.isFinite(limit) && limit > 0 ? limit : 10;
    const skip = (page - 1) * limit;

    const query = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.id', 'DESC')
      .skip(skip)
      .take(limit);

    if (search?.trim()) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('product.name LIKE :search', { search: `%${search}%` })
            .orWhere('product.description LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('category.name LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (categoryId) {
      query.andWhere('product.category_id = :categoryId', { categoryId });
    }

    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasPrevious: page > 1,
        hasNext: page < totalPages,
        previousPage: page > 1 ? page - 1 : 1,
        nextPage: page < totalPages ? page + 1 : totalPages,
      },
    };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    await this.ensureCategoryExists(dto.category_id);
    const product = this.productsRepository.create(dto);
    return this.productsRepository.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.category_id) {
      await this.ensureCategoryExists(dto.category_id);
    }
    Object.assign(product, dto);
    return this.productsRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }

  private async ensureCategoryExists(categoryId: number): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException(
        `Category with ID ${categoryId} does not exist`,
      );
    }
  }
}
