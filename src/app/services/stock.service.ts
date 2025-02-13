import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, addDoc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Stock {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  available: boolean;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private collectionName = 'stocks';

  constructor(private firestore: Firestore) {}

  // 🔄 Obtener todos los registros de stock desde Firestore
  getStocks(): Observable<Stock[]> {
    const stocksCollection = collection(this.firestore, this.collectionName);
    return collectionData(stocksCollection, { idField: 'id' }) as Observable<Stock[]>;
  }

  // ✅ Agregar stock
  addStock(stock: Stock) {
    const stocksCollection = collection(this.firestore, this.collectionName);
    return addDoc(stocksCollection, stock);
  }

  // 🔄 Actualizar stock
  updateStock(stock: Stock) {
    const stockRef = doc(this.firestore, `${this.collectionName}/${stock.id}`);
    return updateDoc(stockRef, { 
      name: stock.name, 
      price: stock.price, 
      quantity: stock.quantity, 
      available: stock.available 
    });
  }
}
