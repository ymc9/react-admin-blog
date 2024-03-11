/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  HttpError,
  type DataProvider,
  type GetListParams,
  type GetManyReferenceParams,
  type Identifier,
} from "react-admin";

type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

export function createDataProvider(
  url: string,
  customFetch?: FetchFn,
): DataProvider {
  const fetcher = customFetch ?? fetch;

  const doFetch = async (url: string, init: RequestInit) => {
    const resp = await fetcher(url, init);
    if (resp.status < 200 || resp.status >= 300) {
      throw new HttpError(resp.statusText, resp.status);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await resp.json();
  };

  const getListQuerySearchParams = (
    params: GetListParams | GetManyReferenceParams,
  ) => {
    const searchParams = new URLSearchParams();
    if (params.filter) {
      Object.entries<any>(params.filter).forEach(([key, value]) => {
        searchParams.set(`filter[${key}]`, value.toString());
      });
    }

    searchParams.set(
      "sort",
      params.sort.order === "ASC" ? params.sort.field : `-${params.sort.field}`,
    );

    searchParams.set(
      "page[offset]",
      ((params.pagination.page - 1) * params.pagination.perPage).toString(),
    );
    searchParams.set("page[limit]", params.pagination.perPage.toString());

    return searchParams.toString();
  };

  const doUpdateOne = (resource: string, id: Identifier, data: any) =>
    doFetch(`${url}/${resource}/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        data: { type: resource, attributes: data },
      }),
      headers: { "Content-Type": "application/json" },
    });

  const doDeleteOne = (resource: string, id: Identifier) =>
    doFetch(`${url}/${resource}/${id}`, {
      method: "DELETE",
    });

  const makeListQueryResult = (
    data: any[],
    meta: { total: number },
    params: GetListParams | GetManyReferenceParams,
  ) => {
    return {
      data: data.map((item: any) => ({ id: item.id, ...item.attributes })),
      total: meta.total,
      pageInfo: {
        hasNextPage:
          meta.total > params.pagination.page * params.pagination.perPage,
        hasPreviousPage: params.pagination.page > 1,
      },
    };
  };

  const allFulfilled = (promises: Promise<Identifier>[]) =>
    Promise.allSettled<Identifier>(promises)
      .then((results) =>
        results.filter(
          (r): r is PromiseFulfilledResult<Identifier> =>
            r.status === "fulfilled",
        ),
      )
      .then((results) => ({ data: results.map((r) => r.value) }));

  return {
    getList: async (resource, params) => {
      const reqUrl = `${url}/${resource}?${getListQuerySearchParams(params)}`;
      const { data, meta } = await doFetch(reqUrl, {
        method: "GET",
      });
      return makeListQueryResult(data, meta, params);
    },

    getOne: async (resource, params) => {
      const reqUrl = `${url}/${resource}/${params.id}`;
      const { data } = await doFetch(reqUrl, {
        method: "GET",
      });
      return {
        data: { id: data.id, ...data.attributes },
      };
    },

    getMany: async (resource, params) => {
      const reqUrl = `${url}/${resource}?filter[id]=${params.ids.join(",")}`;
      const { data } = await doFetch(reqUrl, {
        method: "GET",
      });
      return {
        data: data.map((item: any) => ({ id: item.id, ...item.attributes })),
      };
    },

    getManyReference: async (resource, params) => {
      const relationFilter = `filter[${params.target}]=${params.id.toString()}`;
      const otherFilter = getListQuerySearchParams(params);
      const reqUrl = `${url}/${resource}?${relationFilter}&${otherFilter}`;
      const { data, meta } = await doFetch(reqUrl, {
        method: "GET",
      });
      return makeListQueryResult(data, meta, params);
    },

    create: async (resource, params) => {
      const result = await doFetch(`${url}/${resource}`, {
        method: "POST",
        body: JSON.stringify({
          data: { type: resource, attributes: params.data },
        }),
        headers: { "Content-Type": "application/json" },
      });
      return {
        data: { id: result.id, ...result.attributes },
      };
    },

    update: async (resource, params) =>
      doUpdateOne(resource, params.id, params.data),

    updateMany: async (resource, params) =>
      allFulfilled(
        params.ids.map((id) =>
          doUpdateOne(resource, id, params.data).then(() => id),
        ),
      ),

    delete: async (resource, params) => doDeleteOne(resource, params.id),

    deleteMany: async (resource, params) =>
      allFulfilled(
        params.ids.map((id) => doDeleteOne(resource, id).then(() => id)),
      ),
  } satisfies DataProvider;
}
