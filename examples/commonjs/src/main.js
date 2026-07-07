/* global MyApis */

require('./mock.js')

const alovaPet = require('./api/alova/services/pet.cjs')
const alovaStore = require('./api/alova/services/store.cjs')
const alovaUser = require('./api/alova/services/user.cjs')
require('./api/alova-globals/index.cjs')

const axiosPet = require('./api/axios/services/pet.cjs')
const axiosStore = require('./api/axios/services/store.cjs')
const axiosUser = require('./api/axios/services/user.cjs')

const fetchPet = require('./api/fetch/services/pet.cjs')
const fetchStore = require('./api/fetch/services/store.cjs')
const fetchUser = require('./api/fetch/services/user.cjs');

(async () => {
  // eslint-disable-next-line no-console
  console.log('\n[Alova] ------')
  await alovaPet.addPet({ data: { name: 'Doggo', photoUrls: ['url1'], status: 'available' } })
  await alovaPet.updatePet({ data: { id: 1, name: 'Kitty', photoUrls: ['url2'], status: 'sold' } })
  await alovaPet.findPetsByStatus({ params: { status: 'available' } })
  await alovaPet.getPetById({ pathParams: { petId: 123 } })
  await alovaPet.deletePet({ pathParams: { petId: 456 } })
  await alovaStore.getInventory()
  await alovaStore.placeOrder({ data: { id: 10, petId: 1, quantity: 2, status: 'placed', complete: false } })
  await alovaUser.loginUser({ params: { username: 'admin', password: '123456' } })

  // eslint-disable-next-line no-console
  console.log('[Alova Globals] ------')
  await MyApis.pet.addPet({ data: { name: 'Doggo', photoUrls: ['url1'], status: 'available' } })
  await MyApis.pet.updatePet({ data: { id: 1, name: 'Kitty', photoUrls: ['url2'], status: 'sold' } })
  await MyApis.pet.findPetsByStatus({ params: { status: 'available' } })
  await MyApis.pet.getPetById({ pathParams: { petId: 123 } })
  await MyApis.pet.deletePet({ pathParams: { petId: 456 } })
  await MyApis.store.getInventory()
  await MyApis.store.placeOrder({ data: { id: 10, petId: 1, quantity: 2, status: 'placed', complete: false } })
  await MyApis.user.loginUser({ params: { username: 'admin', password: '123456' } })

  // eslint-disable-next-line no-console
  console.log('[Axios] ------')
  await axiosPet.addPet({ data: { name: 'Doggo', photoUrls: ['url1'], status: 'available' } })
  await axiosPet.updatePet({ data: { id: 1, name: 'Kitty', photoUrls: ['url2'], status: 'sold' } })
  await axiosPet.findPetsByStatus({ params: { status: 'available' } })
  await axiosPet.getPetById({ pathParams: { petId: 123 } })
  await axiosPet.deletePet({ pathParams: { petId: 456 } })
  await axiosStore.getInventory()
  await axiosStore.placeOrder({ data: { id: 10, petId: 1, quantity: 2, status: 'placed', complete: false } })
  await axiosUser.loginUser({ params: { username: 'admin', password: '123456' } })

  // eslint-disable-next-line no-console
  console.log('[Fetch Client] ------')
  await fetchPet.addPet({ body: { name: 'Doggo', photoUrls: ['url1'], status: 'available' } })
  await fetchPet.updatePet({ body: { id: 1, name: 'Kitty', photoUrls: ['url2'], status: 'sold' } })
  await fetchPet.findPetsByStatus({ params: { status: 'available' } })
  await fetchPet.getPetById({ pathParams: { petId: 123 } })
  await fetchPet.deletePet({ pathParams: { petId: 456 } })
  await fetchStore.getInventory()
  await fetchStore.placeOrder({ body: { id: 10, petId: 1, quantity: 2, status: 'placed', complete: false } })
  await fetchUser.loginUser({ params: { username: 'admin', password: '123456' } })
})()
