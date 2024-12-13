// Const
const players = [
    { id: "x", value: "X" },
    { id: "o", value: "O" },
]
const gridSize = 3
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const turnLabel = "Turno"
const winnerLabel = "Ganador"

// Game vars
let gameBoard = []
let history = []
let round = 1

let firstPlayer = 0
let currentTurn = players[firstPlayer]
let winner = undefined

const takeAlphabet = (position) => alphabet[position]

const createCell = (cellId, playerId) => ({
    id: cellId,
    clicked: !!playerId,
    playerId,
})


// Start
const createGrid = () => {
    const amountOfCells = gridSize * gridSize
    for (let i = 0; i < amountOfCells; i += 1) {
        gameBoard.push(createCell(takeAlphabet(i)))
    }
    printGrid()
}

const createRowCol = (elementName, cell) => {
    const rowCol = document.createElement(elementName)
    const cellDiv = document.createElement("div")

    cellDiv.className = "cellDiv"

    rowCol.id = cell.id
    rowCol.onclick = () => cellClick(cell.id)
    if (cell.playerId) {
        cellDiv.innerHTML = players.find(
            (player) => cell.playerId === player.id
        ).value
    }
    rowCol.append(cellDiv)

    return rowCol
}

const createRow = (rowData) => {
    const row = document.createElement("tr")
    
    row.append(...rowData.map((col) => createRowCol("td", col)))

    return row
}

const printGrid = () => {
    document.getElementById("game").innerHTML = ""

    let rowsDivided = []
    for (let i = 0; i < gameBoard.length; i += gridSize) {
        rowsDivided.push(gameBoard.slice(i, gridSize + i));
    }
    
    document.getElementById("game").append(...rowsDivided.map((row) => createRow(row)))
    document.getElementById("turn").innerHTML = currentTurn.value
}

const nextTurn = () => {
    const newIndex = players.findIndex((player) => player.id === currentTurn.id) + 1
    currentTurn = players[(newIndex < players.length) ? newIndex : 0]
    document.getElementById("turn").innerHTML = currentTurn.value
}

const setWinner = () => {
    winner = currentTurn
    document.querySelectorAll('.cellDiv').forEach((cell) => {
        if (cell.innerHTML === currentTurn.value) cell.classList.add("winner")
    })
    document.getElementById("turnOrWinner").innerHTML = winnerLabel
}

const hideWinner = () => {
    winner = undefined
    document.getElementById("turnOrWinner").innerHTML = turnLabel
}

const cellClick = (cellId) => {
    const index = gameBoard.findIndex((cell) => cell.id === cellId)
    if (!winner && !gameBoard[index].clicked) {
        gameBoard[index] = createCell(cellId, currentTurn.id)
        history.push({ id:history.length+1, cellId, playerId: currentTurn.id })
        printGrid()
        if (checkWin(currentTurn.id)) {
            setWinner()
        } else {
            if (gameBoard.every((c) => c.clicked)){
                resetGameBoard()
                cellClick(cellId)
            } else {
                nextTurn()
            }
        }
    }
}

const resetGameBoard = () => {
    gameBoard = []
    history = []
    hideWinner()
    createGrid()
}

const onResetClick = () => {
    firstPlayer = (firstPlayer + 1) < players.length ? firstPlayer+1 : 0
    currentTurn = players[firstPlayer]
    resetGameBoard()
}

const multipleOf = (position, size) => (position % size) === 0

const checkLine = (cells, playerId) => cells.every((c) => c.clicked && c.playerId === playerId)

function checkWin(playerId) { 

    // Convierte el tablero en una matriz bidimensional
    let boardMatrix = []
    for (let i = 0; i < gameBoard.length; i += gridSize) {
        boardMatrix.push(gameBoard.slice(i, gridSize + i));
    }

    // Comprobamos Filas
    const winARow = boardMatrix.some((cellsRow) => checkLine(cellsRow, playerId))

    // Comprobamos Columnas
    let winAColumn = false
    for (let i = 0; i < gridSize; i++) {
        winAColumn = winAColumn || checkLine(boardMatrix.map((row) => row[i]), playerId)
    }

    // Comprobamos Diagonales
    const winADiagonal = 
        checkLine([boardMatrix[0][0], boardMatrix[1][1], boardMatrix[2][2]], playerId) ||
        checkLine([boardMatrix[0][2], boardMatrix[1][1], boardMatrix[2][0]], playerId)


    // Devolvemos resultado
    return winARow || winAColumn || winADiagonal
}

