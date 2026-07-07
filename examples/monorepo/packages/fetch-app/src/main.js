import { setupFetchMock } from '../../../mock.js'
import { fetchClient } from './api/fetch/index.js'

import {
  addPet,
  deletePet,
  findPetsByStatus,
  getPetById,
  updatePet,
} from './api/fetch/services/pet.js'
import { getInventory, placeOrder } from './api/fetch/services/store.js'
import { loginUser } from './api/fetch/services/user.js'

setupFetchMock(fetchClient)

void (async () => {
  // eslint-disable-next-line no-console
  console.log('[Fetch Client] ------')
  await addPet({ body: { name: 'Doggo', photoUrls: ['url1'], status: 'available' } })
  await updatePet({ body: { id: 1, name: 'Kitty', photoUrls: ['url2'], status: 'sold' } })
  await findPetsByStatus({ params: { status: 'available' } })
  await getPetById({ pathParams: { petId: 123 } })
  await deletePet({ pathParams: { petId: 456 } })
  await getInventory({})
  await placeOrder({ body: { id: 10, petId: 1, quantity: 2, status: 'placed', complete: false } })
  await loginUser({ params: { username: 'admin', password: '123456' } })
})()
