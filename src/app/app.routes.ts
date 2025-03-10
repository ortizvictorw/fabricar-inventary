import { Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./auth/login/login.component')
    },
    {
        path: '',
        loadComponent: () => import('./shared/components/layout/layout.component'),
        canActivate: [AuthGuard], 
        children: [
            { path: 'stock', loadComponent: () => import('./business/stock/stock.component') },
            { path: 'consume-stock', loadComponent: () => import('./business/consume-stock/consume-stock.component') },
            { path: 'product', loadComponent: () => import('./business/product/product.component') },
            { path: 'product-add', loadComponent: () => import('./business/product-add/product-add.component') },
            { path: 'product-edit/:id', loadComponent: () => import('./business/product-edit/product-edit.component') },
            { path: 'add-stock', loadComponent: () => import('./business/add-stock/stock-add.component') },
            { path: 'update-prices', loadComponent: () => import('./business/update-prices/update-prices.component') },
            { path: 'category', loadComponent: () => import('./business/category/category.component') },
            { path: 'category-add', loadComponent: () => import('./business/category-add/category-add.component') },
            { path: 'budget', loadComponent: () => import('./business/budget/budget.component') },
            { path: 'budget-add', loadComponent: () => import('./business/budget-add/budget-add.component') },
            { path: 'balance', loadComponent: () => import('./business/balance/balance.component') },
            { path: 'production', loadComponent: () => import('./business/production/production.component') },
            { path: 'production-view/:id', loadComponent: () => import('./business/production-view/production-view.component') },
            { path: '', redirectTo: 'stock', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '404', pathMatch: 'full' }
];

// Move this to a separate config file (e.g., routes.config.ts)
export const routesWithBackButton = [
    'product-add',
    'product-edit',
    'consume-stock',
    'add-stock',
    'update-prices',
    'category-add',
    'budget-add',
    'production-view'
];
