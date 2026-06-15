import { Controller, Get, Post, Render, Req, Res, Body, Query, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories/categories.service';
import { ProductsService } from './products/products.service';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {

  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
    private readonly authService: AuthService,
  ) {}

  // ========== LOGIN PAGE ==========
  @Get('login')
  @Render('login')
  loginPage(@Req() req: any) {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return { redirect: '/' };
    }
    return { title: 'Login - Admin Panel', error: null };
  }

  @Post('login')
  async loginSubmit(@Req() req: any, @Res() res: any, @Body() body: any) {
    try {
      const user = await this.authService.validateUser(body.email, body.password);
      if (!user) {
        return res.render('login', { title: 'Login - Admin Panel', error: 'Email atau password salah!' });
      }
      req.login(user, (err: any) => {
        if (err) {
          return res.render('login', { title: 'Login - Admin Panel', error: 'Terjadi kesalahan saat login.' });
        }
        return res.redirect('/');
      });
    } catch (e) {
      return res.render('login', { title: 'Login - Admin Panel', error: 'Terjadi kesalahan saat login.' });
    }
  }

  @Get('logout')
  logout(@Req() req: any, @Res() res: any) {
    req.logout((err: any) => {
      res.redirect('/login');
    });
  }

  // ========== DASHBOARD ==========
  @Get()
  async dashboard(@Req() req: any, @Res() res: any) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    const categories = await this.categoriesService.findAll(1, 100);
    const products = await this.productsService.findAll(1, 100);
    return res.render('dashboard', {
      title: 'Dashboard - Admin Panel',
      user: req.user,
      totalCategories: categories.meta.total,
      totalProducts: products.meta.total,
    });
  }

  // ========== CATEGORIES VIEWS ==========
  @Get('admin/categories')
  async categoriesIndex(@Req() req: any, @Res() res: any, @Query('page') page?: string, @Query('search') search?: string) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    const result = await this.categoriesService.findAll(page ? parseInt(page) : 1, 10, search);
    return res.render('categories/index', {
      title: 'Categories - Admin Panel',
      user: req.user,
      categories: result.data,
      meta: result.meta,
      search: search || '',
    });
  }

  @Get('admin/categories/create')
  async categoriesCreate(@Req() req: any, @Res() res: any) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    return res.render('categories/form', {
      title: 'Create Category - Admin Panel',
      user: req.user,
      category: null,
      isEdit: false,
      error: null,
    });
  }

  @Post('admin/categories/create')
  async categoriesStore(@Req() req: any, @Res() res: any, @Body() body: any) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    try {
      await this.categoriesService.create({ name: body.name, description: body.description });
      return res.redirect('/admin/categories');
    } catch (e: any) {
      return res.render('categories/form', {
        title: 'Create Category - Admin Panel',
        user: req.user,
        category: body,
        isEdit: false,
        error: e.message || 'Terjadi kesalahan',
      });
    }
  }

  @Get('admin/categories/:id/edit')
  async categoriesEdit(@Req() req: any, @Res() res: any, @Param('id') id: string) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    const category = await this.categoriesService.findOne(parseInt(id));
    return res.render('categories/form', {
      title: 'Edit Category - Admin Panel',
      user: req.user,
      category,
      isEdit: true,
      error: null,
    });
  }

  @Post('admin/categories/:id/edit')
  async categoriesUpdate(@Req() req: any, @Res() res: any, @Param('id') id: string, @Body() body: any) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    try {
      await this.categoriesService.update(parseInt(id), { name: body.name, description: body.description });
      return res.redirect('/admin/categories');
    } catch (e: any) {
      return res.render('categories/form', {
        title: 'Edit Category - Admin Panel',
        user: req.user,
        category: { id: parseInt(id), ...body },
        isEdit: true,
        error: e.message || 'Terjadi kesalahan',
      });
    }
  }

  @Get('admin/categories/:id/delete')
  async categoriesDelete(@Req() req: any, @Res() res: any, @Param('id') id: string) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    await this.categoriesService.remove(parseInt(id));
    return res.redirect('/admin/categories');
  }

  @Get('admin/categories/:id')
  async categoriesDetail(@Req() req: any, @Res() res: any, @Param('id') id: string) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    const category = await this.categoriesService.findOne(parseInt(id));
    return res.render('categories/detail', {
      title: `${category.name} - Admin Panel`,
      user: req.user,
      category,
    });
  }

  // ========== PRODUCTS VIEWS ==========
  @Get('admin/products')
  async productsIndex(@Req() req: any, @Res() res: any, @Query('page') page?: string, @Query('search') search?: string) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    const result = await this.productsService.findAll(page ? parseInt(page) : 1, 10, search);
    return res.render('products/index', {
      title: 'Products - Admin Panel',
      user: req.user,
      products: result.data,
      meta: result.meta,
      search: search || '',
    });
  }

  @Get('admin/products/create')
  async productsCreate(@Req() req: any, @Res() res: any) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
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
  async productsStore(@Req() req: any, @Res() res: any, @Body() body: any) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    try {
      await this.productsService.create({
        category_id: parseInt(body.category_id),
        name: body.name,
        description: body.description,
        price: parseFloat(body.price),
        stock: parseInt(body.stock),
        image_url: body.image_url || null,
        status: body.status || 'active',
      });
      return res.redirect('/admin/products');
    } catch (e: any) {
      const categories = await this.categoriesService.findAll(1, 100);
      return res.render('products/form', {
        title: 'Create Product - Admin Panel',
        user: req.user,
        product: body,
        categories: categories.data,
        isEdit: false,
        error: e.message || 'Terjadi kesalahan',
      });
    }
  }

  @Get('admin/products/:id/edit')
  async productsEdit(@Req() req: any, @Res() res: any, @Param('id') id: string) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    const product = await this.productsService.findOne(parseInt(id));
    const categories = await this.categoriesService.findAll(1, 100);
    return res.render('products/form', {
      title: 'Edit Product - Admin Panel',
      user: req.user,
      product,
      categories: categories.data,
      isEdit: true,
      error: null,
    });
  }

  @Post('admin/products/:id/edit')
  async productsUpdate(@Req() req: any, @Res() res: any, @Param('id') id: string, @Body() body: any) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    try {
      await this.productsService.update(parseInt(id), {
        category_id: parseInt(body.category_id),
        name: body.name,
        description: body.description,
        price: parseFloat(body.price),
        stock: parseInt(body.stock),
        image_url: body.image_url || null,
        status: body.status || 'active',
      });
      return res.redirect('/admin/products');
    } catch (e: any) {
      const categories = await this.categoriesService.findAll(1, 100);
      return res.render('products/form', {
        title: 'Edit Product - Admin Panel',
        user: req.user,
        product: { id: parseInt(id), ...body },
        categories: categories.data,
        isEdit: true,
        error: e.message || 'Terjadi kesalahan',
      });
    }
  }

  @Get('admin/products/:id/delete')
  async productsDelete(@Req() req: any, @Res() res: any, @Param('id') id: string) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    await this.productsService.remove(parseInt(id));
    return res.redirect('/admin/products');
  }

  @Get('admin/products/:id')
  async productsDetail(@Req() req: any, @Res() res: any, @Param('id') id: string) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    const product = await this.productsService.findOne(parseInt(id));
    return res.render('products/detail', {
      title: `${product.name} - Admin Panel`,
      user: req.user,
      product,
    });
  }
}
