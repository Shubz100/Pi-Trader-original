import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const LEVELS = [
    { name: 'Rookie', threshold: 1000, pointsPerHundredXP: 1 },
    { name: 'Bronze', threshold: 1200, pointsPerHundredXP: 3 },
    { name: 'Silver', threshold: 1300, pointsPerHundredXP: 5 },
    { name: 'Gold', threshold: 1400, pointsPerHundredXP: 7 },
    { name: 'Diamond', threshold: 1500, pointsPerHundredXP: 10 },
    { name: 'Platinum', threshold: 1600, pointsPerHundredXP: 15 }
];

function calculateProfileMetrics(piAmountArray: number[]) {
    // Calculate total Pi sold
    const totalPiSold = piAmountArray.reduce((sum, amount) => sum + amount, 0);
    
    // Calculate XP (1 Pi = 1 XP)
    const xp = totalPiSold;
    
    // Calculate current level
    const currentLevel = LEVELS.findIndex(lvl => xp < lvl.threshold);
    const level = currentLevel === -1 ? LEVELS.length : currentLevel;
    
    // Calculate Pi points based on level and XP
    const pointsRate = LEVELS[level - 1]?.pointsPerHundredXP || LEVELS[LEVELS.length - 1].pointsPerHundredXP;
    const piPoints = Math.floor(xp / 100) * pointsRate;

    return {
        totalPiSold,
        xp,
        level,
        piPoints
    };
}

export async function POST(req: NextRequest) {
    try {
        const userData = await req.json()

        if (!userData || !userData.id) {
            return NextResponse.json({ error: 'Invalid user data' }, { status: 400 })
        }

        let user = await prisma.user.findUnique({
            where: { telegramId: userData.id }
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId: userData.id,
                    username: userData.username || '',
                    firstName: userData.first_name || '',
                    lastName: userData.last_name || '',
                    isPending: false
                }
            })
        }

        // Calculate profile metrics
        const metrics = calculateProfileMetrics(user.piAmount);

        // Return combined user data and metrics
        return NextResponse.json({
            ...user,
            ...metrics
        })
    } catch (error) {
        console.error('Error processing user data:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
