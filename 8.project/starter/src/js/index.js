import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List'
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoder } from './views/base';

/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

const controlSearch = async () => {
  // 1) Get query from view
  const query = searchView.getInput();

  if (query) {
    // 2) New search object and add to state
    state.search = new Search(query);

    // 3) Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    try {
      // 4) Search for recipes
      await state.search.getResults();
      // console.log(state.search.results);

      // 5) Render results on UI
      clearLoder();
      searchView.renderResults(state.search.results);

    } catch (err) {
      console.log(err);
      clearLoder();
      alert('Something wrong with the search...');
    }
  }
}

elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
  // 不管是点击span 还是 svg 他都会找最近的btn-inlineclass返回到btn
  const btn = e.target.closest('.btn-inline');
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10); // 这里的10代表转换为10进制
    searchView.clearResults();
    searchView.renderResults(state.search.results, goToPage);
  }
});

/** 
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
  // 获得url上的hash
  const id = window.location.hash.replace('#', '');
  // console.log(id)
  if (id) {
    // Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    // Highlight selected search item
    if (state.search) searchView.highlightSelected(id);

    // get recipe data
    state.recipe = new Recipe(id);

    try {
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();
      state.recipe.calcTime();
      state.recipe.calcServings();

      // render recipe view
      clearLoder();
      // console.log( state.likes.isLiked(id) );
      recipeView.renderRecipe(
        state.recipe,
        state.likes.isLiked(id)
      );

    } catch (err) {
      clearLoder();
      console.log(err + 'in index.js controlRecipe');
    }

  }
}

// url 上的参数或者叫hash改变, 调用 controlRecipe
window.addEventListener('hashchange', controlRecipe);
// 页面重新加载 调用controlRecipe
window.addEventListener('load', controlRecipe);

// ['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/** 
 * LIST CONTROLLER
 */

const controlList = () => {
  if(!state.list) state.list = new List();
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;
  // Handle the delete button
  if (e.target.matches('.shopping__delete, .shopping__delete *')) {
    state.list.deleteItem(id);
    listView.deleteItem(id);
  // Handle the count update
  } else if (e.target.matches('.shopping__count-value')) { 
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});


/** 
 * LIKE CONTROLLER
 */
const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;
  if (!state.likes.isLiked(state.recipe.id)){
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    likesView.toggleLikeBtn(true);
    likesView.renderLike(newLike)
  }else{
    state.likes.deleteLike(currentID);
    likesView.toggleLikeBtn(false);
    likesView.deleteLike(currentID);
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
}

// Restore liked recipes on page load
window.addEventListener('load', () => {
  state.likes = new Likes();
  
  // Restore likes
  state.likes.readStorage();

  // Toggle like menu button
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  // Render the existing likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
});


// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
  if (e.target.matches('.btn-decrease, .btn-decrease *')) {
      // Decrease button is clicked
      if (state.recipe.servings > 1) {
          state.recipe.updateServings('dec');
          recipeView.updateServingsIngredients(state.recipe);
      }
  } else if (e.target.matches('.btn-increase, .btn-increase *')) {
      // Increase button is clicked
      state.recipe.updateServings('inc');
      recipeView.updateServingsIngredients(state.recipe);
  } 
  else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
      // Add ingredients to shopping list
      controlList();
  } else if (e.target.matches('.recipe__love, .recipe__love *')) {
      // Like controller
      controlLike();
  }
});
