// --- Alova ---
import * as alovaPet from './api/alova/services/pet'

import * as alovaStore from './api/alova/services/store'
import * as alovaUser from './api/alova/services/user'
// --- Axios ---
import * as axiosPet from './api/axios/services/pet'
import * as axiosStore from './api/axios/services/store'

import * as axiosUser from './api/axios/services/user'
// --- Fetch Client ---
import * as fetchPet from './api/fetch/services/pet'
import * as fetchStore from './api/fetch/services/store'

import * as fetchUser from './api/fetch/services/user'
// --- Ky ---
import * as kyPet from './api/ky/services/pet'
import * as kyStore from './api/ky/services/store'

import * as kyUser from './api/ky/services/user'
import './mock'
import './api/alova-globals/index';

// ---- Alova ----
(async () => {
  // eslint-disable-next-line no-console
  console.log('\n[Alova] ------')
  await alovaPet.addPet({ data: { name: 'Doggo', photoUrls: ['url1'], status: 'available' } })
  await alovaPet.updatePet({ data: { id: 1, name: 'Kitty', photoUrls: ['url2'], status: 'sold' } })
  await alovaPet.findPetsByStatus({ params: { status: 'available' } })
  await alovaPet.getPetById({ pathParams: { petId: 123 } })
  await alovaPet.deletePet({ pathParams: { petId: 456 } })
  await alovaStore.getInventory({})
  await alovaStore.placeOrder({ data: { id: 10, petId: 1, quantity: 2, status: 'placed', complete: false } })
  await alovaUser.loginUser({ params: { username: 'admin', password: '123456' } })

  // ---- Alova Globals ----
  // eslint-disable-next-line no-console
  console.log('[Alova Globals] ------')
  await MyApis.pet.addPet({ data: { name: 'Doggo', photoUrls: ['url1'], status: 'available' } })
  await MyApis.pet.updatePet({ data: { id: 1, name: 'Kitty', photoUrls: ['url2'], status: 'sold' } })
  await MyApis.pet.findPetsByStatus({ params: { status: 'available' } })
  await MyApis.pet.getPetById({ pathParams: { petId: 123 } })
  await MyApis.pet.deletePet({ pathParams: { petId: 456 } })
  await MyApis.store.getInventory({})
  await MyApis.store.placeOrder({ data: { id: 10, petId: 1, quantity: 2, status: 'placed', complete: false } })
  await MyApis.user.loginUser({ params: { username: 'admin', password: '123456' } })

  // ---- Axios ----
  // eslint-disable-next-line no-console
  console.log('[Axios] ------')
  await axiosPet.addPet({ data: { name: 'Doggo', photoUrls: ['url1'], status: 'available' } })
  await axiosPet.updatePet({ data: { id: 1, name: 'Kitty', photoUrls: ['url2'], status: 'sold' } })
  await axiosPet.findPetsByStatus({ params: { status: 'available' } })
  await axiosPet.getPetById({ pathParams: { petId: 123 } })
  await axiosPet.deletePet({ pathParams: { petId: 456 } })
  await axiosStore.getInventory({})
  await axiosStore.placeOrder({ data: { id: 10, petId: 1, quantity: 2, status: 'placed', complete: false } })
  await axiosUser.loginUser({ params: { username: 'admin', password: '123456' } })

  // ---- Fetch Client ----
  // eslint-disable-next-line no-console
  console.log('[Fetch Client] ------')
  await fetchPet.addPet({ body: { name: 'Doggo', photoUrls: ['url1'], status: 'available' } })
  await fetchPet.updatePet({ body: { id: 1, name: 'Kitty', photoUrls: ['url2'], status: 'sold' } })
  await fetchPet.findPetsByStatus({ params: { status: 'available' } })
  await fetchPet.getPetById({ pathParams: { petId: 123 } })
  await fetchPet.deletePet({ pathParams: { petId: 456 } })
  await fetchStore.getInventory({})
  await fetchStore.placeOrder({ body: { id: 10, petId: 1, quantity: 2, status: 'placed', complete: false } })
  await fetchUser.loginUser({ params: { username: 'admin', password: '123456' } })

  // ---- Ky ----
  // eslint-disable-next-line no-console
  console.log('[Ky] ------')
  await kyPet.addPet({ json: { name: 'Doggo', photoUrls: ['url1'], status: 'available' } })
  await kyPet.updatePet({ json: { id: 1, name: 'Kitty', photoUrls: ['url2'], status: 'sold' } })
  await kyPet.findPetsByStatus({ searchParams: { status: 'available' } })
  await kyPet.getPetById({ pathParams: { petId: 123 } })
  await kyPet.deletePet({ pathParams: { petId: 456 } })
  await kyStore.getInventory({})
  await kyStore.placeOrder({ json: { id: 10, petId: 1, quantity: 2, status: 'placed', complete: false } })
  await kyUser.loginUser({ searchParams: { username: 'admin', password: '123456' } })
})()
