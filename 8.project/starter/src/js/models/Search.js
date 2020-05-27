import axios from 'axios';

class Search {
  constructor(query) {
    this.query = query;
  }

  async getResults() {
    try {
      const res = await axios.get(`https://forkify-api.herokuapp.com/api/search?&q=${this.query}`);
      this.results = res.data.recipes;
      // console.log(this.results);
      // console.log(res);
    } catch (error) {
      console.log('search.js ' + error);
      alert(error);
    }
  }
}


export default Search