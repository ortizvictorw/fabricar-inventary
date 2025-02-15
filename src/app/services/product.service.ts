import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, addDoc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { StockService } from './stock.service';

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  category: string;
  quantity?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private collectionName = 'products';

  constructor(private firestore: Firestore, private stockService: StockService) {}

  // Obtener productos desde Firestore
  getProducts(): Observable<Product[]> {
    const productsCollection = collection(this.firestore, this.collectionName);
    return collectionData(productsCollection, { idField: 'id' }) as Observable<Product[]>;
  }

  // Obtener producto por ID desde Firestore
  getProductById(id: string): Observable<Product | undefined> {
    const productRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return docData(productRef, { idField: 'id' }) as Observable<Product>;
  }

  // Agregar un nuevo producto y automáticamente crear su stock con cantidad 0
  async addProduct(product: Product) {
    try {
      const productsCollection = collection(this.firestore, this.collectionName);
      const productRef = await addDoc(productsCollection, product);

      // Agregar stock automáticamente con cantidad 0
      await this.stockService.addStock({
        id: productRef.id, // Usa el mismo ID del producto
        name: product.name,
        price: product.price ?? 0,
        quantity: 0,
        available: product.available,
        category: product.category
      });

      return productRef;
    } catch (error) {
      console.error('Error al agregar producto y stock:', error);
      throw error;
    }
  }

  // Actualizar un producto en Firestore
  updateProduct(product: Product) {
    const productRef = doc(this.firestore, `${this.collectionName}/${product.id}`);
    return updateDoc(productRef, { 
      name: product.name, 
      price: product.price, 
      available: product.available, 
      category: product.category 
    });
  }
}
