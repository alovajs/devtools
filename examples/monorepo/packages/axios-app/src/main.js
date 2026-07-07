import { setupAxiosMock } from '../../../mock.js'
import { axiosInstance } from './api/axios/index.js'

import {
  addPet,
  deletePet,
  findPetsByStatus,
  getPetById,
  updatePet,
} from './api/axios/services/pet.js'
import { getInventory, placeOrder } from './api/axios/services/store.js'
import { loginUser } from './api/axios/services/user.js'

setupAxiosMock(axiosInstance)

void (async () => {
  // eslint-disable-next-line no-console
  console.log('[Axios] ------')
  await addPet({ data: { name: 'Doggo', photoUrls: ['url1'], status: 'available' } })
  await updatePet({ data: { id: 1, name: 'Kitty', photoUrls: ['url2'], status: 'sold' } })
  await findPetsByStatus({ params: { status: 'available' } })
  await getPetById({ pathParams: { petId: 123 } })
  await deletePet({ pathParams: { petId: 456 } })
  await getInventory({})
  await placeOrder({ data: { id: 10, petId: 1, quantity: 2, status: 'placed', complete: false } })
  await loginUser({ params: { username: 'admin', password: '123456' } })
})()
