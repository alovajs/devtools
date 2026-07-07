import { setupKyMock } from '../../../mock.js'

import {
  addPet,
  deletePet,
  findPetsByStatus,
  getPetById,
  updatePet,
} from './api/ky/services/pet.js'
import { getInventory, placeOrder } from './api/ky/services/store.js'
import { loginUser } from './api/ky/services/user.js'

setupKyMock()

void (async () => {
  // eslint-disable-next-line no-console
  console.log('[Ky] ------')
  await addPet({ json: { name: 'Doggo', photoUrls: ['url1'], status: 'available' } })
  await updatePet({ json: { id: 1, name: 'Kitty', photoUrls: ['url2'], status: 'sold' } })
  await findPetsByStatus({ searchParams: { status: 'available' } })
  await getPetById({ pathParams: { petId: 123 } })
  await deletePet({ pathParams: { petId: 456 } })
  await getInventory({})
  await placeOrder({ json: { id: 10, petId: 1, quantity: 2, status: 'placed', complete: false } })
  await loginUser({ searchParams: { username: 'admin', password: '123456' } })
})()
