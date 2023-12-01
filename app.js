$(function () {
  // Variables
  const API_KEY = 'VHwrnVYHbcO5ZM9RQWIzWFxQoehoPBaG';
  const BASE_URL = 'https://api.giphy.com/v1/gifs';
  const SEARCH_ENDPOINT = '/search';
  const TRENDING_ENDPOINT = '/trending';
  const BATCH_SIZE = 8;
  let currQuery;

  // Functions
  /**
   * Called when user submits the search form. Grabs and passes
   * query + desired endpoint to getGifs().
   * @param {SubmitEvent} event Used to prevent form refresh.
   */
  function onSubmitSearch(event) {
    event.preventDefault();
    currQuery = $('.search__input').val();
    $('.search__input').val('');
    getGifs(SEARCH_ENDPOINT, currQuery);
  }

  /**
   * Makes a call to the giphy API at the specified endpoint with optional
   * params, if included.
   *
   * On success, parses data + pagination info and passes it off to be
   * rendered.
   *
   * On Fail, alerts the user of the issue and to try again later.
   * @param {String} endpoint Desired endpoint to make a call to.
   * @param {String} query Optional query to be used in giphy API call
   * @param {Number} offset Optional param used for pagination. (Default of 0 = page 1)
   */
  async function getGifs(endpoint, query = '', offset = 0) {
    try {
      const params = generateParams(endpoint, query, offset);
      const response = await axios.get(BASE_URL + endpoint, params);

      const { data } = response.data;
      renderPreviews(extractUrls(data));

      const { offset: currOffset, total_count: total } = response.data.pagination;
      updatePageData(endpoint, currOffset, total);
    } catch (e) {
      alert('There was an issue. Try again later.');
    }
  }

  /**
   * Generates params object to be used in axios.get() call.
   * @param {String} endpoint Desired endpoint for API call.
   * @param {String} query Query used in the SEARCH_ENDPOINT
   * @param {Number} offset Offset in current API Response
   * @returns
   */
  function generateParams(endpoint, query, offset) {
    const obj = {
      params: {
        api_key: API_KEY,
        limit: BATCH_SIZE,
        offset,
      },
    };
    if (endpoint === SEARCH_ENDPOINT) {
      obj.params.q = query;
    }
    return obj;
  }
  /**
   * Takes a list of gif objects and maps them to an Arr of objects containing
   * the originzal size url and the preview size url.
   * @param {Array} gifs Array containing gif objects from giphy API response.
   * @returns Array of objects in format of { original, preview }
   */
  const extractUrls = (gifs) =>
    gifs.map((gif) => ({
      original: gif.images.original.url,
      preview: gif.images.preview_gif.url,
    }));

  /**
   * Unhides .preview-grid and renders Array of gifs inside of it.
   * @param {Array} gifs Array of objects in format of { origincal, preview }
   */
  function renderPreviews(gifs) {
    $('.preview-grid').removeClass('hidden');
    $('.preview-grid__content').fadeOut(200, function () {
      $(this).empty();
      for (let gif of gifs) {
        $('<img>')
          .addClass('preview')
          .attr('src', gif.preview)
          .on('click', renderGif.bind(null, gif.original))
          .appendTo($('.preview-grid__content'));
      }
      $(this).fadeIn(200);
    });
  }

  /**
   * Updates Page number in .preview-grid and passes the offset
   * and total to addPagingListeners().
   * @param {String} endpoint Desired endpoint for API call.
   * @param {Number} offset Offset in current API Response.
   * @param {Number} total Total items for current query.
   */
  function updatePageData(endpoint, offset, total) {
    // offset starts at 0 and is only ever increased by BATCH_SIZE
    // so it's always divisible by it, but currPage is always behind by one.
    // (0 / 1 = 0, 8 / 8 = 1) Adding 1 fixes page #.
    const currPage = offset / BATCH_SIZE + 1;

    // total / BATCH_SIZE gives us totalPages. If it's not a clean divide and
    // has a decimal, that means there's a next page, just not necessarily a full page.
    // Math.ceil() corrects the page # in these cases.
    const totalPages = Math.ceil(total / BATCH_SIZE);
    $('.preview-grid__page').text(`Page ${currPage} of ${totalPages}`);

    addPagingListeners(endpoint, offset, total);
  }

  /**
   * Adds click listeners to .preview-grid__prev/next to page
   * through the API results. Uses provided offset and total from
   * Giphy API to calculate where we are in Response and adds
   * the listeners accordingly.
   * @param {Number} offset Offset in current API Response.
   * @param {Number} total Total items for current query.
   */
  function addPagingListeners(endpoint, offset, total) {
    removeEventListeners(
      'click',
      $('.preview-grid__prev'),
      $('.preview-grid__next')
    );
    // Offset === 0 means we're on page one, so no prev page.
    // Offset - BATCH_SIZE moves us back one page.
    if (offset !== 0) {
      $('.preview-grid__prev').on(
        'click',
        getGifs.bind(null, endpoint, currQuery, offset - BATCH_SIZE)
      );
    }
    // Offset + BATCH_SIZE >= total means we're on last page, so no next page.
    // Offset + BATCH_SIZE moves us forward one page.
    if (!(offset + BATCH_SIZE >= total)) {
      $('.preview-grid__next').on(
        'click',
        getGifs.bind(null, endpoint, currQuery, offset + BATCH_SIZE)
      );
    }
  }

  /**
   * Removes all eventListeners of provided type from provided elements.
   * @param {String} type Type of event to remove from elements
   * @param  {...any} elements Elements to remove eventListeners from.
   */
  function removeEventListeners(type, ...elements) {
    for (let element of elements) {
      element.off(type);
    }
  }

  /**
   * Resets .preview-grid to default, empty state and removes it from
   * the screen.
   */
  function hidePreviews() {
    // Empty takes care of removing listeners for .preview-grid__content
    $('.preview-grid__content').empty();
    removeEventListeners($('.preview-grid'));
    $('.preview-grid').fadeOut(200, function () {
      // jQuery fade methods add inline styles that we need to remove.
      $(this).removeAttr('style').addClass('hidden');
    });
    currQuery = '';
  }

  /**
   * Takes a url and creates + renders a gif to .gif-grid.
   * @param {String} url Url to original size gif
   */
  function renderGif(url) {
    $('<img>')
      .addClass('gif')
      .attr('src', url)
      .appendTo($('.gif-grid__content'))
  }

  /**
   * Clears out all gifs in .gif-grid__content.
   */
  function clearGifs() {
    $('.gif-grid__content').fadeOut(200, function() {
      $(this).removeAttr('style').empty();
    })
  }

  // Event Listeners
  $('.search').on('submit', onSubmitSearch);
  $('.trending__submit-btn').on('click', getGifs.bind(null, TRENDING_ENDPOINT));
  $('.preview-grid__hide-btn').on('click', hidePreviews);
  $('.gif-grid__clear-btn').on('click', clearGifs);
});
