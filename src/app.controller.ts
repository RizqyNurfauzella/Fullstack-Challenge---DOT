import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { RequestWithUser } from './auth/auth.types';
import { AuthService } from './auth/auth.service';
import { CategoriesService } from './categories/categories.service';
import { ProductsService } from './products/products.service';

const productImageUpload = FileInterceptor('image', {
  storage: diskStorage({
    destination: join(process.cwd(), 'public', 'uploads'),
    filename: (_req, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${randomUUID()}${extension}`);
    },
  }),
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new BadRequestException('File harus berupa gambar.'), false);
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

@Controller()
export class AppController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
    private readonly authService: AuthService,
  ) {}

  @Get('login')
  loginPage(@Req() req: RequestWithUser, @Res() res: Response) {
    if (this.isAuthenticated(req)) {
      return res.redirect('/');
    }

    return res.render('login', {
      title: 'Login - Admin Panel',
      error: null,
      email: '',
    });
  }

  @Post('login')
  async loginSubmit(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Body() body: { email?: string; password?: string },
  ) {
    const email = body.email?.trim() || '';

    try {
      const user = await this.authService.validateUser(
        email,
        body.password || '',
      );
      if (!user) {
        return res.status(401).render('login', {
          title: 'Login - Admin Panel',
          error: 'Email atau password salah.',
          email,
        });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).render('login', {
            title: 'Login - Admin Panel',
            error: 'Terjadi kesalahan saat membuat session login.',
            email,
          });
        }

        return res.redirect('/');
      });
    } catch {
      return res.status(500).render('login', {
        title: 'Login - Admin Panel',
        error: 'Terjadi kesalahan saat login.',
        email,
      });
    }
  }

  @Get('logout')
  logout(@Req() req: RequestWithUser, @Res() res: Response) {
    req.logout(() => res.redirect('/login'));
  }

  @Get()
  async dashboard(@Req() req: RequestWithUser, @Res() res: Response) {
    if (this.redirectGuest(req, res)) return;

    const categories = await this.categoriesService.findAll(1, 1);
    const products = await this.productsService.findAll(1, 1);

    return res.render('dashboard', {
      title: 'Dashboard - Admin Panel',
      user: req.user,
      totalCategories: categories.meta.total,
      totalProducts: products.meta.total,
    });
  }

  @Get('admin/categories')
  async categoriesIndex(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Query('page') page?: string,
    @Query('search') search?: string,
    @Query('error') error?: string,
  ) {
    if (this.redirectGuest(req, res)) return;

    const result = await this.categoriesService.findAll(
      this.parsePage(page),
      10,
      search,
    );

    return res.render('categories/index', {
      title: 'Categories - Admin Panel',
      user: req.user,
      categories: result.data,
      meta: result.meta,
      search: search || '',
      error: error || null,
    });
  }

  @Get('admin/categories/create')
  categoriesCreate(@Req() req: RequestWithUser, @Res() res: Response) {
    if (this.redirectGuest(req, res)) return;

    return res.render('categories/form', {
      title: 'Create Category - Admin Panel',
      user: req.user,
      category: null,
      isEdit: false,
      error: null,
    });
  }

  @Post('admin/categories/create')
  async categoriesStore(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Body() body: { name?: string; description?: string },
  ) {
    if (this.redirectGuest(req, res)) return;

    try {
      await this.categoriesService.create({
        name: body.name || '',
        description: body.description || '',
      });
      return res.redirect('/admin/categories');
    } catch (error) {
      return res.status(400).render('categories/form', {
        title: 'Create Category - Admin Panel',
        user: req.user,
        category: body,
        isEdit: false,
        error: this.errorMessage(error),
      });
    }
  }

  @Get('admin/categories/:id/edit')
  async categoriesEdit(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    if (this.redirectGuest(req, res)) return;

    try {
      const category = await this.categoriesService.findOne(Number(id));
      return res.render('categories/form', {
        title: 'Edit Category - Admin Panel',
        user: req.user,
        category,
        isEdit: true,
        error: null,
      });
    } catch (error) {
      return this.renderNotFound(res, this.errorMessage(error));
    }
  }

  @Post('admin/categories/:id/edit')
  async categoriesUpdate(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
  ) {
    if (this.redirectGuest(req, res)) return;

    try {
      await this.categoriesService.update(Number(id), {
        name: body.name || '',
        description: body.description || '',
      });
      return res.redirect('/admin/categories');
    } catch (error) {
      return res.status(400).render('categories/form', {
        title: 'Edit Category - Admin Panel',
        user: req.user,
        category: { id: Number(id), ...body },
        isEdit: true,
        error: this.errorMessage(error),
      });
    }
  }

  @Get('admin/categories/:id/delete')
  async categoriesDelete(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    if (this.redirectGuest(req, res)) return;

    try {
      await this.categoriesService.remove(Number(id));
      return res.redirect('/admin/categories');
    } catch (error) {
      return res.redirect(
        `/admin/categories?error=${encodeURIComponent(this.errorMessage(error))}`,
      );
    }
  }

  @Get('admin/categories/:id')
  async categoriesDetail(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    if (this.redirectGuest(req, res)) return;

    try {
      const category = await this.categoriesService.findOne(Number(id));
      return res.render('categories/detail', {
        title: `${category.name} - Admin Panel`,
        user: req.user,
        category,
      });
    } catch (error) {
      return this.renderNotFound(res, this.errorMessage(error));
    }
  }

  @Get('admin/products')
  async productsIndex(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Query('page') page?: string,
    @Query('search') search?: string,
    @Query('category_id') categoryId?: string,
    @Query('error') error?: string,
  ) {
    if (this.redirectGuest(req, res)) return;

    const categoryFilter = categoryId ? Number(categoryId) : undefined;
    const [result, categories] = await Promise.all([
      this.productsService.findAll(
        this.parsePage(page),
        10,
        search,
        categoryFilter,
      ),
      this.categoriesService.findAll(1, 100),
    ]);

    return res.render('products/index', {
      title: 'Products - Admin Panel',
      user: req.user,
      products: result.data,
      categories: categories.data,
      meta: result.meta,
      search: search || '',
      selectedCategoryId: categoryFilter,
      error: error || null,
    });
  }

  @Get('admin/products/create')
  async productsCreate(@Req() req: RequestWithUser, @Res() res: Response) {
    if (this.redirectGuest(req, res)) return;

    const categories = await this.categoriesService.findAll(1, 100);
    return res.render('products/form', {
      title: 'Create Product - Admin Panel',
      user: req.user,
      product: null,
      categories: categories.data,
      isEdit: false,
      error: null,
    });
  }

  @Post('admin/products/create')
  @UseInterceptors(productImageUpload)
  async productsStore(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @UploadedFile() image: Express.Multer.File | undefined,
    @Body()
    body: {
      category_id?: string;
      name?: string;
      description?: string;
      price?: string;
      stock?: string;
      image_url?: string;
      status?: string;
    },
  ) {
    if (this.redirectGuest(req, res)) return;

    try {
      await this.productsService.create(this.toProductPayload(body, image));
      return res.redirect('/admin/products');
    } catch (error) {
      const categories = await this.categoriesService.findAll(1, 100);
      return res.status(400).render('products/form', {
        title: 'Create Product - Admin Panel',
        user: req.user,
        product: body,
        categories: categories.data,
        isEdit: false,
        error: this.errorMessage(error),
      });
    }
  }

  @Get('admin/products/:id/edit')
  async productsEdit(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    if (this.redirectGuest(req, res)) return;

    try {
      const [product, categories] = await Promise.all([
        this.productsService.findOne(Number(id)),
        this.categoriesService.findAll(1, 100),
      ]);
      return res.render('products/form', {
        title: 'Edit Product - Admin Panel',
        user: req.user,
        product,
        categories: categories.data,
        isEdit: true,
        error: null,
      });
    } catch (error) {
      return this.renderNotFound(res, this.errorMessage(error));
    }
  }

  @Post('admin/products/:id/edit')
  @UseInterceptors(productImageUpload)
  async productsUpdate(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File | undefined,
    @Body()
    body: {
      category_id?: string;
      name?: string;
      description?: string;
      price?: string;
      stock?: string;
      image_url?: string;
      status?: string;
    },
  ) {
    if (this.redirectGuest(req, res)) return;

    try {
      await this.productsService.update(
        Number(id),
        this.toProductPayload(body, image),
      );
      return res.redirect('/admin/products');
    } catch (error) {
      const categories = await this.categoriesService.findAll(1, 100);
      return res.status(400).render('products/form', {
        title: 'Edit Product - Admin Panel',
        user: req.user,
        product: { id: Number(id), ...body },
        categories: categories.data,
        isEdit: true,
        error: this.errorMessage(error),
      });
    }
  }

  @Get('admin/products/:id/delete')
  async productsDelete(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    if (this.redirectGuest(req, res)) return;

    try {
      await this.productsService.remove(Number(id));
      return res.redirect('/admin/products');
    } catch (error) {
      return res.redirect(
        `/admin/products?error=${encodeURIComponent(this.errorMessage(error))}`,
      );
    }
  }

  @Get('admin/products/:id')
  async productsDetail(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    if (this.redirectGuest(req, res)) return;

    try {
      const product = await this.productsService.findOne(Number(id));
      return res.render('products/detail', {
        title: `${product.name} - Admin Panel`,
        user: req.user,
        product,
      });
    } catch (error) {
      return this.renderNotFound(res, this.errorMessage(error));
    }
  }

  private isAuthenticated(req: RequestWithUser): boolean {
    return Boolean(req.isAuthenticated?.());
  }

  private redirectGuest(req: RequestWithUser, res: Response): boolean {
    if (!this.isAuthenticated(req)) {
      res.redirect('/login');
      return true;
    }

    return false;
  }

  private parsePage(page?: string): number {
    const parsed = Number(page);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  private toProductPayload(
    body: {
      category_id?: string;
      name?: string;
      description?: string;
      price?: string;
      stock?: string;
      image_url?: string;
      status?: string;
    },
    image?: Express.Multer.File,
  ) {
    return {
      category_id: Number(body.category_id),
      name: body.name || '',
      description: body.description || '',
      price: Number(body.price),
      stock: Number(body.stock),
      image_url: image
        ? `/uploads/${image.filename}`
        : body.image_url || undefined,
      status: body.status || 'active',
    };
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Terjadi kesalahan. Silakan coba lagi.';
  }

  private renderNotFound(res: Response, message: string) {
    return res.status(404).render('error', {
      title: 'Data tidak ditemukan - Admin Panel',
      message,
    });
  }
}
