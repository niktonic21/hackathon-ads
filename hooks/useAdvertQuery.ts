import axios from "axios";
import { useQuery } from "react-query";
import { SERAPI_KEY } from "../env";

export const getAdsQueryKey = (keyword: string) => ["ads", keyword];

const fetchAdvertisements = async (keyword: string) => {
  if (!keyword) return {};

  console.log(
    "getAdvertisements",
    `https://serpapi.com/search.json?q=${keyword}+%20buy&hl=en`
  );
  const { data } = await axios.get(
    `https://serpapi.com/search.json?q=${keyword}+%20buy&hl=en&api_key=${SERAPI_KEY}`
  );
  return data;
};

const useAdvertQuery = (keyword: string) => {
  return useQuery(["ads", keyword], () => fetchAdvertisements(keyword), {
    cacheTime: 1000 * 60 * 60 * 24, //1 day
    staleTime: 1000 * 60 * 60 * 24, //1 day
  });
};

export const parseAds = (data) => {
  if (
    !!data.shopping_results &&
    data.shopping_results.length > 0
    // && data.shopping_results[0].block_position == "top"
  ) {
    console.log("parseAds shop list", data.shopping_results[0]);
    return data.shopping_results[0];
  } else if (
    !!data.ads &&
    data.ads.length > 0 //&& data.ads[0].block_position == "top"
  ) {
    console.log("parseAds ads", data.ads[0]);
    return data.ads[0];
  } else {
    console.log("No suitable results");
    return null;
  }
};

export default useAdvertQuery;
