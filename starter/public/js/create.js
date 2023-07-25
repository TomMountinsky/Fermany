

const createTour = async(name, summary, description, price)=>{
    console.log(name, summary, description. price);
  try{
     const res = await axios({
          method:'POST',
          url:'/api/v1/tours',
          data: {
            name,
            summary,
            description,
            price
          }
     });
     console.log(res);
  }
  catch(err){
       console.log(err.response.data);
  }
  
}

document.querySelector('.form').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const summary = document.querySelector('#summary').value;
    const description = document.querySelector('#description').value;
    const price = document.querySelector('#price').value;
    createTour(name, summary, description, price);
}
);