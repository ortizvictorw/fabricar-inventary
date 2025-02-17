import { Component, OnInit } from '@angular/core';
import { BalanceService, Balance } from '../../services/balance.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export default class BalanceComponent implements OnInit {
  balances: Balance[] = [];
  filteredBalances: Balance[] = [];
  searchQuery: string = '';
  selectedMonth: string = '';
  selectedProduct: string = '';
  months = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];
  uniqueProducts: string[] = [];

  constructor(private balanceService: BalanceService) {}

  ngOnInit() {
    this.balanceService.getAllBalances().subscribe((balances) => {
      this.balances = balances;
      this.filteredBalances = balances;
      this.uniqueProducts = [...new Set(balances.map(b => b.productName))];
    });
  }

  applyFilter() {
    let query = this.searchQuery.toLowerCase();
    this.filteredBalances = this.balances.filter(balance => 
      (!query || balance.client.toLowerCase().includes(query) || balance.observation.toLowerCase().includes(query)) &&
      (!this.selectedMonth || new Date(balance.createdAt).getMonth() + 1 === +this.selectedMonth) &&
      (!this.selectedProduct || balance.productName === this.selectedProduct)
    );
  }

  exportToExcel() {
    if (this.filteredBalances.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay datos para exportar',
        text: 'No hay registros filtrados para exportar a Excel.',
      });
      return;
    }

    // Datos principales
    const worksheetData = this.filteredBalances.map(balance => ({
      Cliente: balance.client,
      Producto: balance.productName,
      Cantidad: balance.quantity || 1,
      Precio_Unitario: balance.unitPrice,
      Observación: balance.observation,
      Operador: balance.operator,
      Fecha: new Date(balance.createdAt).toLocaleDateString(),
      Total: balance.quantity * balance.unitPrice
    }));

    // Generar resumen de productos vendidos
    const productSummary: { productName: string; totalQuantity: number; totalPrice: number }[] = [];
    let totalSales = 0;

    this.filteredBalances.forEach(balance => {
      let product = productSummary.find(p => p.productName === balance.productName);
      if (product) {
        product.totalQuantity += balance.quantity;
        product.totalPrice += balance.quantity * balance.unitPrice;
      } else {
        productSummary.push({
          productName: balance.productName,
          totalQuantity: balance.quantity,
          totalPrice: balance.quantity * balance.unitPrice
        });
      }
      totalSales += balance.quantity * balance.unitPrice;
    });

    // Generar hoja de Excel
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(worksheetData);

/*     // Agregar espacio vacío y resumen al final
    const summaryStartRow = worksheetData.length + 3;
    XLSX.utils.sheet_add_json(ws, [{ Producto: "Resumen de Ventas" }], { origin: `A${summaryStartRow}` });
    XLSX.utils.sheet_add_json(ws, productSummary, { origin: `A${summaryStartRow + 1}` });
    XLSX.utils.sheet_add_json(ws, [{ Producto: "Total Vendido", totalPrice: totalSales }], { origin: `A${summaryStartRow + productSummary.length + 2}` }); */

    // Crear el libro y exportarlo
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Balances');
    XLSX.writeFile(wb, 'balances.xlsx');

    Swal.fire({
      icon: 'success',
      title: '¡Exportación Exitosa!',
      text: 'El archivo balances.xlsx se ha descargado correctamente.',
    });
  }
}
