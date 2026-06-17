import { test, expect } from '@playwright/test';

test('home carrega e link para cardapio', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /cardápio/i }).first()).toBeVisible();
});

test('cardapio lista produtos ou combos', async ({ page }) => {
  await page.goto('/cardapio');
  await expect(page.getByRole('heading', { name: /cardápio|favoritos/i }).first()).toBeVisible({ timeout: 15000 });
});

test('checkout redireciona se carrinho vazio', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page.getByText(/carrinho está vazio/i)).toBeVisible();
});
