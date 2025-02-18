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

        return new Observable(observer => {
            docData(originalBudgetRef).subscribe(budget => {
                if (budget) {
                    // Clonar el presupuesto en 'confirmedBudgets'
                    setDoc(confirmedBudgetRef, { ...budget, enabled: true })
                        .then(() => {
                            // Eliminar el presupuesto original de 'budgets'
                            return deleteDoc(originalBudgetRef);
                        })
                        .then(() => {
                            observer.next();
                            observer.complete();
                        })
                        .catch(error => observer.error(error));
                } else {
                    observer.error(new Error('Budget not found'));
                }
            });
        });
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
                if (!budget || !budget['products'] || budget['products'].length === 0) {
                    return throwError(() => new Error('Budget not found or empty products list'));
                }
    
                // Consultar stock de todos los productos por nombre y categoría
                const stockChecks$ = budget['products'].map((product: Product) => {
                    const stockCollectionRef = collection(this.firestore, 'stocks'); // Referencia a la colección 'stocks'
    
                    // Crear la consulta para buscar el producto en stock por nombre y categoría
                    const stockQuery = query(
                        stockCollectionRef,
                        where('name', '==', product.name),
                        where('category', '==', product.category)
                    );
    
                    return from(getDocs(stockQuery)).pipe(
                        take(1),
                        tap(snapshot => console.log(`Stock obtenido de Firestore para ${product.name}:`, snapshot.docs.map(doc => doc.data()))),
                        map(snapshot => {
                            if (snapshot.empty) {
                                console.warn(`Stock no encontrado para: ${product.name} en la categoría ${product.category}`);
                                return { product, availableStock: 0, isAvailable: false };
                            }
    
                            // Obtener el primer documento encontrado
                            const stockData = snapshot.docs[0].data() as Product;
                            return {
                                product,
                                availableStock: stockData.quantity || 0,
                                isAvailable: stockData.available !== undefined ? stockData.available : false
                            };
                        })
                    );
                });
    
                return forkJoin<{ product: Product, availableStock: number, isAvailable: boolean }[]>(stockChecks$).pipe(
                    switchMap((stockResults: { product: Product, availableStock: number, isAvailable: boolean }[]) => {
                        // Filtrar productos sin stock suficiente o no disponibles
                        const insufficientStock = stockResults.filter(({ product, availableStock, isAvailable }) =>
                            Number(product.quantity) > Number(availableStock) || !isAvailable
                        );
    
                        if (insufficientStock.length > 0) {
                            const errorMessage = insufficientStock.map(({ product, availableStock, isAvailable }) => 
                                `- ${product.name}: ${isAvailable ? `Stock disponible: ${availableStock}, solicitado: ${product.quantity}` : 'No disponible'}`
                            ).join('\n');
    
                            // Mostrar alerta con el stock disponible
                            Swal.fire({
                                icon: 'warning',
                                title: 'Stock insuficiente',
                                text: `Los siguientes productos no tienen suficiente stock:\n${errorMessage}`,
                                confirmButtonText: 'Aceptar'
                            });
    
                            // Retornar un error para que pueda ser manejado en el componente
                            return throwError(() => new Error(`Stock insuficiente:\n${errorMessage}`));
                        }
    
                        // Si hay stock suficiente, proceder con la creación del balance
                        const batch = stockResults.map(({ product }) => {
                            const balanceRef = doc(this.firestore, `balance/${id}_${product.id}`);
                            return setDoc(balanceRef, {
                                balanceId: id,
                                client: budget['client'],
                                observation: budget['observation'],
                                operator: budget['operator'],
                                productName: product.name,
                                quantity: Number(product.quantity),
                                unitPrice: Number(product.price),
                                totalPrice: Number(product.quantity) * Number(product.price),
                                createdAt: budget['createdAt'],
                                validity: budget['validity'],
                                timestamp: new Date()
                            });
                        });
    
                        return from(Promise.all(batch)).pipe(
                            switchMap(() => from(deleteDoc(confirmedBudgetRef)))
                        );
                    })
                );
            }),
            catchError(error => {
                console.error('Error en confirmBudgetAndCreateBalance:', error);
                return throwError(() => error);
            })
        );
    }
    
    
    
    
    
}
