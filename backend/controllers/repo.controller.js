

export const createRepository=(req,res)=>{
    res.send("Repoo created");
}

export const getAllRepositories=(req,res)=>{
    res.send("ALl REpoos fetched");
}

export const fetchRepositoryById=(req,res)=>{
    res.send("Repoo with id fetched");
}

export const fetchRepositoryByName=(req,res)=>{
    res.send("Repoo of the name fetched");
}

export const fetchRepositoryForCurrentUser=(req,res)=>{
    res.send("Repo of cuurent user fetched");
}

export const updateRepositoryById=(req,res)=>{
    res.send("repo updated");
}

export const toggleVisibilityById=(req,res)=>{
    res.send("Repooos visibility toggledd");
}

export const deleteRepositoryById=(req,res)=>{
    res.send("Repoo deleted");
}



