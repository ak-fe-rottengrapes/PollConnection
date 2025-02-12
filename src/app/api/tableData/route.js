import { getConnection, sql } from "../../../../dbConfig";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const interval = url.searchParams.get('interval') || '12'; 

        if (!startDate || !endDate) {
            return Response.json({
                error: "Both startDate and endDate parameters are required"
            }, { status: 400 });
        }

        const pool = await getConnection();

        // Convert date strings to UTC date range
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);

        // Query to get data for the specified date range with dynamic intervals
        const query = `
            WITH TimeIntervals AS (
                SELECT 
                    *,
                    DATEADD(HOUR, 
                        DATEDIFF(HOUR, 0, createdAt) / @interval * @interval, 
                        CAST(CAST(createdAt AS DATE) AS DATETIME)
                    ) AS intervalStart,
                    DATEADD(HOUR, 
                        (DATEDIFF(HOUR, 0, createdAt) / @interval * @interval) + @interval, 
                        CAST(CAST(createdAt AS DATE) AS DATETIME)
                    ) AS intervalEnd
                FROM locationdata 
                WHERE createdAt >= @startDate 
                AND createdAt <= @endDate
            )
            SELECT 
                *,
                FORMAT(createdAt, 'yyyy-MM-dd') as dateString,
                CONCAT(
                    FORMAT(intervalStart, 'HH:mm'), 
                    ' - ', 
                    FORMAT(intervalEnd, 'HH:mm')
                ) as timeInterval
            FROM TimeIntervals
            ORDER BY createdAt
        `;

        const result = await pool.request()
            .input('startDate', sql.DateTime, start)
            .input('endDate', sql.DateTime, end)
            .input('interval', sql.Int, parseInt(interval))
            .query(query);

        // Format the response with a flat data structure
        return Response.json({
            startDate,
            endDate,
            intervalHours: interval,
            data: result.recordset
        });

    } catch (error) {
        console.error("Error fetching data: ", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}