import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

function Page() {
  const [todos, setTodos] = useState([])

  useEffect(() => {
    async function getTodos() {
      const { data, error } = await supabase.from('todos').select('*')
      if (error) {
        console.error('Error fetching todos:', error)
      } else {
        setTodos(data)
      }
    }

    getTodos()
  }, [])

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Todo List</h2>
      <ul className="list-disc pl-4">
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title || JSON.stringify(todo)}</li>
        ))}
      </ul>
    </div>
  )
}

export default Page
