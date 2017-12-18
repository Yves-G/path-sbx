function PriorityQueue()
{
	this.items = [];
}

PriorityQueue.prototype.cmp = function(a, b)
{
	if (b.rank > a.rank) // higher costs are lower priority
		return true;
	if (a.rank > b.rank)
		return false;
	// Need to tie-break to get a consistent ordering
	if (b.h > a.h) // higher heuristic costs are lower priority
		return true;
	if (a.h > b.h)
		return false;
	if (a.id < b.id)
		return true;
	if (b.id < a.id)
		return false;

	alert("duplicate tiles in queue");
	return false;
}

PriorityQueue.prototype.size = function()
{
	return this.items.length;
}

PriorityQueue.prototype.push = function(id, rank, h)
{
	this.items.push({ "id": id, "rank": rank, "h": h });
}

PriorityQueue.prototype.pop = function()
{
	this.items.sort(this.cmp);
	return this.items.pop();
}

PriorityQueue.prototype.promote = function(id, newRank, newH)
{
	let elem = this.items.find(function(item) { return item.id == id; })
	if (!elem) 
		alert("PriorityQueue: invalid item passed to promote");
	elem.rank = newRank;
	elem.h = newH;	
	this.items.sort(this.cmp);
}




