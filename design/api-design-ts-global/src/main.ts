const result = await Apis.pet.uploadFile({
  pathParams: {
    petId: 23
  },
  data: {},
  transformData(data, headers) {
    // 处理返回的数据
    return data.message;
  },
  params: {}
});
