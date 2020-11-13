import sys
from operator import add
from collections import namedtuple
import bisect


# Point = namedtuple('Point', ['x', 'y'])
class Point:
    def __init__(self, xPos_, yPos_):
        self.x = xPos_
        self.y = yPos_

class GraphMinSpan:
    def __init__(self, vertices):
        self.V = vertices
        self.graph = []

    def addEdge(self, u, v, w):
        self.graph.append([u, v, w])

    def find(self, parent, i):
        if parent[i] == i:
            return i
        return self.find(parent, parent[i])

    def union(self, parent, rank, x, y):
        xroot = self.find(parent, x)
        yroot = self.find(parent, y)

        if rank[xroot] < rank[yroot]:
            parent[xroot] = yroot
        elif rank[xroot] > rank[yroot]:
            parent[yroot] = xroot
        else:
            parent[yroot] = xroot
            rank[xroot] += 1

    def KruskalMST(self):

        result = []

        i = 0
        e = 0

        self.graph = sorted(self.graph, key=lambda item: item[2])

        parent = []
        rank = []

        for node in range(self.V):
            parent.append(node)
            rank.append(0)

        while e < self.V - 1:
            u, v, w = self.graph[i]
            i = i + 1
            x = self.find(parent, u)
            y = self.find(parent, v)

            if x != y:
                e = e + 1
                result.append([u, v, w])
                self.union(parent, rank, x, y)
        sumWeight = 0
        for u, v, weight in result:
            sumWeight += weight

        return sumWeight


class GraphMinimized:
    def __init__(self, vertices_):
        self.vertices = vertices_
        self.dust = []
        self.pos = Point(0, 0)

        self.graph = [[0 for column in range(self.vertices)]
                      for row in range(self.vertices)]

    def minimumDistance(self, distances, remainingSet):
        min = sys.maxsize

        minimumIndex = 0

        for vert in range(self.vertices):
            if distances[vert] < min and remainingSet[vert] == False:
                min = distances[vert]
                minimumIndex = vert

        return minimumIndex

    def dijsktraAlgo(self, source):
        distances = [sys.maxsize] * self.vertices
        distances[source] = 0
        remainingSet = [False] * self.vertices

        for vert in range(self.vertices):

            vertMinDist = self.minimumDistance(distances, remainingSet)

            remainingSet[vertMinDist] = True

            for adjVert in range(self.vertices):
                if self.graph[vertMinDist][adjVert] > 0 and remainingSet[adjVert] == False and \
                distances[adjVert] > distances[vertMinDist] + self.graph[vertMinDist][adjVert]:
                    distances[adjVert] = distances[vertMinDist] + self.graph[vertMinDist][adjVert]

        return distances

    def getMST(self, removed):
        removed.sort()
        minGraph = GraphMinSpan(self.vertices - len(removed))
        for value in range(self.vertices):
            value_shift = bisect.bisect_left(removed, value)
            if value not in removed:
                for neigh in range(self.vertices):
                    neigh_shift = bisect.bisect_left(removed, neigh)
                    if neigh not in removed and value != neigh:
                        print("Adding edge", value - value_shift, neigh - neigh_shift, self.graph[value][neigh])
                        minGraph.addEdge(value - value_shift, neigh - neigh_shift, self.graph[value][neigh])

        return minGraph.KruskalMST()

    def getMSTs(self, truly_removed):
        msts = []
        for i in range(self.vertices):
            if i not in truly_removed:
                msts.append(self.getMST(truly_removed + [i]))
        return msts


    def vacuum(self):
        removed = [0]
        path = [0]

        while len(removed) != self.vertices:
            dijsktraDist = self.dijsktraAlgo(path[-1])

            pos = list(range(self.vertices))

            print("Pos in", pos)
            print("Dijsktra", dijsktraDist)
            for rem in removed:
                pos.remove(rem)

            msts = self.getMSTs(removed)

            print("Msts", msts)
            summed_list = list(map(add, dijsktraDist, msts))

            print("Summed list", summed_list)
            print("Pos", pos)
            print(summed_list.index(min(summed_list)))

            next_point = pos[summed_list.index(min(summed_list))]

            removed.append(next_point)
            path.append(next_point)
            print("Path in progress", path)
            print("Removed in progress", removed)

        return path


def solveInstance(height, width, agents):
    print(len(agents))
    graph = GraphMinimized(len(agents))

    gArr = []

    for agent in agents:
        dist = []
        for otherAgent in agents:
            dist.append(abs(agent[0] - otherAgent[0]) + abs(agent[1] - otherAgent[1]))
        gArr.append(dist)

    graph.graph = gArr

    print('Path', graph.vacuum())


solveInstance(2, 2, [[0, 0], [0, 1], [1, 0]])

