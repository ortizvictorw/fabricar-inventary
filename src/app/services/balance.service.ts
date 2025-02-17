import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Balance {
    id: string;
    client: string;
    observation: string;
    operator: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    finalPrice: number;
    validity: string;
    createdAt: string;
    enabled: boolean;
    completed: boolean;
    timestamp: Date;
}

@Injectable({
    providedIn: 'root'
})
export class BalanceService {
    private readonly balanceCollection = 'balance'; // Nombre de la colección en Firestore

    constructor(private firestore: Firestore) {}

    // Recuperar todos los balances de la base de datos con manejo de errores
    getAllBalances(): Observable<Balance[]> {
        const balanceRef = collection(this.firestore, this.balanceCollection);
        return collectionData(balanceRef, { idField: 'id' }).pipe(
            map((balances) => balances as Balance[]),
            catchError((error) => {
                console.error('Error fetching balances:', error);
                return [];
            })
        );
    }
}
