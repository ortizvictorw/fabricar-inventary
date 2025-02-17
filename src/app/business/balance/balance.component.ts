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

  constructor(private balanceService: BalanceService) {}

  ngOnInit() {
    this.balanceService.getAllBalances().subscribe((balances) => {
      this.balances = balances;
      this.filteredBalances = balances;
    });
  }

  applyFilter() {
    const query = this.searchQuery.toLowerCase();
    this.filteredBalances = this.balances.filter(balance => 
      balance.client.toLowerCase().includes(query) ||
      balance.observation.toLowerCase().includes(query)
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

    const worksheetData = this.filteredBalances.map(balance => ({
      Cliente: balance.client,
      Producto: balance.productName,
      Cantidad: balance.quantity,
      Precio_Unitario: balance.unitPrice,
      Observación: balance.observation,
      Operador: balance.operator,
      Fecha: new Date(balance.createdAt).toLocaleDateString(),
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(worksheetData);
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
