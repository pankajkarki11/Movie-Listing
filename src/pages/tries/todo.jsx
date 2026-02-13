import { useState, useEffect, useMemo, useCallback } from "react";
import Table, { useTableSearches, filterByColumnSearches } from "../Table";

const Todo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const [todo, setTodo] = useState([]);
  const [post, setPost] = useState([]);

  const todoSearchState = useTableSearches();
   const postSearchState = useTableSearches();

  const fetchtodo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://jsonplaceholder.typicode.com/todos");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setTodo(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchtodo();
  }, [fetchtodo]);

  const filteredTodos = filterByColumnSearches(todo, todoSearchState.searches);

  const clearAllFilters = () => {
    postSearchState.clearSearches();
       todoSearchState.clearSearches();
  };


   const fetchpost = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://jsonplaceholder.typicode.com/posts");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setPost(data);}
    catch (err) {
      setError(err);
    }
      
     finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchpost();
  }, [fetchpost]);


   const filteredposts = filterByColumnSearches(post, postSearchState.searches);

  return (
    <div className="flex flex-col bg-slate-900 min-h-screen text-slate-100 px-4 pb-8">
      <div className="flex items-center justify-between py-6 mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          🎬 Movie Listing
        </h1>
        <h1>
          <button
            className="bg-red-500 text-white hover:bg-red-600 border-b-4 border-red-600 px-4 py-2 rounded-lg"
            onClick={() => {
              setIsVisible(!isVisible);
              clearAllFilters();
            }}
          >
            {isVisible ? "Close Search" : "Search Table"}
          </button>
        </h1>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading todo…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-red-400 text-sm">{error.message}</p>
          <button
            onClick={fetchtodo}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm hover:border-slate-500 transition"
          >
            Retry
          </button>
        </div>
      ) : (
        <div>
        <Table searchState={todoSearchState}>
          <Table.Header>
            <Table.HeaderCell className="hidden sm:table-cell" width={60}>
              #
            </Table.HeaderCell>

            <Table.HeaderCell
              className="hidden sm:table-cell"
              width={100}
              searchable={isVisible}
              dataKey={isVisible ? "id" : undefined}
            >
              ID
            </Table.HeaderCell>

            <Table.HeaderCell
              searchable={isVisible}
              dataKey={isVisible ? "userId" : undefined}
            >
              UserId
            </Table.HeaderCell>

            <Table.HeaderCell
              className="hidden md:table-cell"
              searchable={isVisible}
              dataKey={isVisible ? "title" : undefined}
            >
              Title
            </Table.HeaderCell>

            <Table.HeaderCell
              className="hidden lg:table-cell"
              searchable={isVisible}
              dataKey={isVisible ? "completed" : undefined}
              width={200}
            >
              Completed
            </Table.HeaderCell>
          </Table.Header>

          <Table.Body activeFilterCount={todoSearchState.activeCount}>
            {filteredTodos.map((todo) => {
              const indexx = todo.id - 1;

              return (
                <Table.Row key={todo.id}>
                  {/* # */}
                  <Table.Cell className="hidden sm:table-cell text-slate-500 text-xs tabular-nums">
                    {indexx + 1}
                  </Table.Cell>

                  {/* ID + poster */}
                  <Table.Cell className="hidden sm:table-cell">
                    <div className="flex flex-col items-start gap-1.5">
                      {todo.id}
                    </div>
                  </Table.Cell>

                  {/* Title (+ poster on mobile) */}
                  <Table.Cell>
                    <div className="flex items-start gap-3">{todo.userId}</div>
                  </Table.Cell>

                  {/* Release date */}
                  <Table.Cell className="hidden md:table-cell text-xs font-mono text-slate-400">
                    {todo.title}
                  </Table.Cell>

                  {/* Genres */}
                  <Table.Cell className="hidden lg:table-cell">
                    {todo.completed ? "true" : "false"}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>



     <Table searchState={postSearchState}>
          <Table.Header>
            <Table.HeaderCell className="hidden sm:table-cell" width={60}>
              #
            </Table.HeaderCell>

            <Table.HeaderCell
              className="hidden sm:table-cell"
              width={100}
              searchable={isVisible}
              dataKey={isVisible ? "id" : undefined}
            >
              ID
            </Table.HeaderCell>

            <Table.HeaderCell
              searchable={isVisible}
              dataKey={isVisible ? "userId" : undefined}
            >
              UserId
            </Table.HeaderCell>

            <Table.HeaderCell
              className="hidden md:table-cell"
              searchable={isVisible}
              dataKey={isVisible ? "title" : undefined}
            >
              Title
            </Table.HeaderCell>

            <Table.HeaderCell
              className="hidden lg:table-cell"
              searchable={isVisible}
              dataKey={isVisible ? "body" : undefined}
              
            >
              post
            </Table.HeaderCell>
          </Table.Header>

          <Table.Body activeFilterCount={postSearchState.activeCount}>
            {filteredposts.map((post) => {
              const indexx = post.id - 1;

              return (
                <Table.Row key={post.id}>
                  {/* # */}
                  <Table.Cell className="hidden sm:table-cell text-slate-500 text-xs tabular-nums">
                    {indexx + 1}
                  </Table.Cell>

                  {/* ID + poster */}
                  <Table.Cell className="hidden sm:table-cell">
                    <div className="flex flex-col items-start gap-1.5">
                      {post.id}
                    </div>
                  </Table.Cell>

                  {/* Title (+ poster on mobile) */}
                  <Table.Cell>
                    <div className="flex items-start gap-3">{post.userId}</div>
                  </Table.Cell>

                  {/* Release date */}
                  <Table.Cell className="hidden md:table-cell text-xs font-mono text-slate-400">
                    {post.title}
                  </Table.Cell>

                  {/* Genres */}
                  <Table.Cell className="hidden lg:table-cell">
                    {post.body}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>




        </div>












      )}
    </div>
  );
};

export default Todo;
