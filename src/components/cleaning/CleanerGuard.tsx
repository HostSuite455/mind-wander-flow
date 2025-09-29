import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Navigate } from 'react-router-dom'

export default function CleanerGuard({ children }: { children: JSX.Element }) {
  const [ok, setOk] = useState<boolean|null>(null)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setOk(false)
      
      const { data } = await supabase
        .from('cleaners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      
      setOk(!!data)
    })()
  }, [])

  if (ok === null) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    )
  }
  
  if (!ok) return <Navigate to="/login" replace />
  
  return children
}