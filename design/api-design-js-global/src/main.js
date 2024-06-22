import { useRequest } from 'alova';
import './api';
// test
const data = await Apis.pet.getPetById({
  pathParams: {
    petId: 2
  }
});
Apis.user.deleteUser({
  pathParams: {
    username: '232'
  }
});
