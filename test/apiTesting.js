fetch('https://www.googleapis.com/books/v1/volumes?q=harry+potter&key=AIzaSyB-iXb65IK6xKZ_b7_z6lBhocovQWgnWh4')
  .then(response => response.json())
  .then(data => {
    console.log(data.items);
  });