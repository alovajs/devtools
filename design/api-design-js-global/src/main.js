import { useRequest } from 'alova';
import './api';
// test
const method = Apis.user.userLogin(
  { username: '', password: '' },
  {
    name: '123',
    params: {
      a: 1,
      b: 2
    },
    cache: 'force-cache',
    credentials: 'same-origin',
    transformData: (data, headers) => {
      return !!data.success;
    }
  }
);

const { data, loading, send } = useRequest(method, {
  initialData: {},
  immediate: false
});
const res = await Apis.pet.getPetById({ petId: 1 });
const b = await Apis.clients.generate(
  {
    lang: 'xxx',
    options: {
      additionalProperties: 'string'
    }
  },
  {
    params: {
      codegenOptionsURL: ''
    }
  }
);
Apis.clients
  .languagesMulti({
    params: {
      types: ['config', 'documentation', 'config']
    }
  })
  .then(res => {
    console.log(res);
  });
