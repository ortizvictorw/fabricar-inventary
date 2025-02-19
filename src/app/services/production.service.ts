import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, setDoc, updateDoc, docData, deleteDoc, getDocs, where, query } from '@angular/fire/firestore';
import { Observable, catchError, forkJoin, from, map, switchMap, take, tap, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { Product } from './product.service';

export interface Budget {
    id?: string;
    observation: string;
    client: string;
    operator: string;
    finalPrice: number;
    validity: string;
    createdAt: string;
    enabled: boolean;
    completed?: boolean;
    products: Product[];
}
@Injectable({
    providedIn: 'root'
})
export class ProductionService {
    private readonly budgetsCollection = 'budgets'; // Colección de presupuestos normales
    private readonly confirmedBudgetsCollection = 'confirmedBudgets'; // Presupuestos confirmados

    constructor(private firestore: Firestore) { }

    // Obtener presupuestos confirmados desde Firestore
    getConfirmedBudgets(): Observable<Budget[]> {
        const budgetCollection = collection(this.firestore, this.confirmedBudgetsCollection);
        return collectionData(budgetCollection, { idField: 'id' }) as Observable<Budget[]>;
    }

    // Confirmar un presupuesto (Moverlo a la colección 'confirmedBudgets' y eliminarlo de 'budgets')
    confirmBudget(id: string): Observable<void> {
        const originalBudgetRef = doc(this.firestore, `${this.budgetsCollection}/${id}`);
        const confirmedBudgetRef = doc(this.firestore, `${this.confirmedBudgetsCollection}/${id}`);
    
        return docData(originalBudgetRef).pipe(
            take(1),
            switchMap(budget => {
                if (!budget || !budget['products'] || budget['products'].length === 0) {
                    return throwError(() => new Error('Budget not found or empty products list'));
                }
    
                const stockChecks$ = budget['products'].map((product: Product) => {
                    const stockCollectionRef = collection(this.firestore, 'stocks');
                    const stockQuery = query(
                        stockCollectionRef,
                        where('name', '==', product.name),
                        where('category', '==', product.category)
                    );
    
                    return from(getDocs(stockQuery)).pipe(
                        take(1),
                        map(snapshot => {
                            if (snapshot.empty) {
                                return { product, availableStock: 0, stockDocId: null };
                            }
                            const stockDoc = snapshot.docs[0];
                            return {
                                product,
                                availableStock: stockDoc.data()['quantity'] || 0,
                                stockDocId: stockDoc.id
                            };
                        })
                    );
                });
    
                return forkJoin(stockChecks$).pipe(
                    switchMap((stockResults: any) => {
                        const productsForConfirmed: Product[] = [];
                        const remainingProducts: Product[] = [];
                        let confirmedTotalPrice = 0;
                        let remainingTotalPrice = 0;
    
                        const batchUpdates = stockResults.map(({ product, availableStock, stockDocId }: { product: Product, availableStock: number, stockDocId: string | null }) => {
                            if (!stockDocId) {
                                remainingProducts.push(product);
                                remainingTotalPrice += Number(product.quantity) * Number(product.price);
                                return null;
                            }
    
                            const neededQuantity = Number(product.quantity);
                            if (availableStock >= neededQuantity) {
                                productsForConfirmed.push({ ...product, quantity: neededQuantity });
                                confirmedTotalPrice += neededQuantity * Number(product.price);
                                const newStockQuantity = availableStock - neededQuantity;
                                return updateDoc(doc(this.firestore, `stocks/${stockDocId}`), { quantity: newStockQuantity });
                            } else {
                                productsForConfirmed.push({ ...product, quantity: availableStock });
                                confirmedTotalPrice += availableStock * Number(product.price);
                                remainingProducts.push({ ...product, quantity: neededQuantity - availableStock });
                                remainingTotalPrice += (neededQuantity - availableStock) * Number(product.price);
                                return updateDoc(doc(this.firestore, `stocks/${stockDocId}`), { quantity: 0 });
                            }
                        }).filter(Boolean);
    
                        if (batchUpdates.length === 0) {
                            return throwError(() => new Error('No stock available for any product'));
                        }
    
                        return from(Promise.all(batchUpdates)).pipe(
                            switchMap(() => {
                                return setDoc(confirmedBudgetRef, { 
                                    ...budget, 
                                    products: productsForConfirmed,
                                    finalPrice: confirmedTotalPrice
                                }).then(() => {
                                    if (remainingProducts.length > 0) {
                                        Swal.fire({
                                            icon: 'info',
                                            title: 'Stock insuficiente',
                                            text: 'Se ha creado un nuevo presupuesto con los productos restantes.',
                                            confirmButtonText: 'Aceptar'
                                        });
                                        const newBudgetRef = doc(this.firestore, `${this.budgetsCollection}/${id}_remaining`);
                                        return setDoc(newBudgetRef, { 
                                            ...budget, 
                                            products: remainingProducts,
                                            finalPrice: remainingTotalPrice
                                        });
                                    }
                                    return Promise.resolve();
                                }).then(() => deleteDoc(originalBudgetRef));
                            })
                        );
                    })
                );
            }),
            catchError(error => {
                console.error('Error in confirmBudget:', error);
                return throwError(() => error);
            })
        );
    }    
    

    // Obtener un presupuesto por ID (de la colección de confirmados)
    getBudgetById(id: string): Observable<Budget | undefined> {
        const budgetRef = doc(this.firestore, `${this.confirmedBudgetsCollection}/${id}`);
        return docData(budgetRef, { idField: 'id' }) as Observable<Budget>;
    }

    // Marcar presupuesto como completado
    completeBudget(id: string): Observable<void> {
        const budgetRef = doc(this.firestore, `${this.confirmedBudgetsCollection}/${id}`);
        return from(updateDoc(budgetRef, { completed: true }));
    }

    // Descartar un presupuesto (de la colección de confirmados)
    discardBudget(id: string): Observable<void> {
        const budgetRef = doc(this.firestore, `${this.budgetsCollection}/${id}`);
        return from(deleteDoc(budgetRef));
    }

    confirmBudgetAndCreateBalance(id: string): Observable<void> {
        const confirmedBudgetRef = doc(this.firestore, `${this.confirmedBudgetsCollection}/${id}`);
        return docData(confirmedBudgetRef).pipe(
            take(1),
            switchMap(budget => {
                if (!budget) {
                    return throwError(() => new Error('Budget not found'));
                }
    
                const balanceRef = doc(this.firestore, `balance/${id}`);
                return from(setDoc(balanceRef, {
                    balanceId: id,
                    client: budget['client'],
                    observation: budget['observation'],
                    operator: budget['operator'],
                    finalPrice: budget['finalPrice'],
                    createdAt: budget['createdAt'],
                    validity: budget['validity'],
                    timestamp: new Date()
                })).pipe(
                    switchMap(() => from(deleteDoc(confirmedBudgetRef)))
                );
            }),
            catchError(error => {
                console.error('Error in confirmBudgetAndCreateBalance:', error);
                return throwError(() => error);
            })
        );
    }
}
