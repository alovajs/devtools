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
Apis.pet.uploadFile({
  pathParams: {},
  data: {}
});
Apis.store.placeOrder({
  data: {}
});
Apis.store.deleteOrder({
  pathParams: {
    orderId: '1'
  }
});
const data = await Apis.pet.getPetById({
  pathParams: {
    petId: 2
  },
  transformData(data) {
    return data.status;
  }
});
