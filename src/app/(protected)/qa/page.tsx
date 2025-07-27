"use client"
import React, { useEffect, useState } from 'react'

import useProjects from '@/hooks/use-projects'

const Page = () => {
  const { Project } = useProjects();
  const [commits, setCommits] = useState<any[]>([]);
  const [savedCommits, setSavedCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!Project?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/commits?projectId=${Project.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch commits');
      }
      
      const data = await response.json();
      setCommits(data.unprocessedCommits || []);
      setSavedCommits(data.savedCommits || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching commits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [Project]);
  return (
    <div className="p-6">
      {JSON.stringify(commits)}
    </div>
  )
}

export default Page


// import React from 'react'

// const page = () => {
//   return (
//     <div>
//       Hello
//     </div>
//   )
// }

// export default page
